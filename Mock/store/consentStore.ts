import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getConsents,
  updateConsent as updateConsentAPI,
} from '../services/ConsentApiCalls';
import { useAuthStore } from './authStore';

const CONSENT_STORAGE_KEY = 'user_consents';

// ── Types ──────────────────────────────────────────────────────────────
interface ConsentState {
  consents: Record<string, boolean>;

  // Actions
  loadConsents: () => Promise<void>;
  hasConsent: (consentType: string) => boolean;
  updateConsent: (consentType: string, granted: boolean) => Promise<void>;
  updateMultipleConsents: (
    consentUpdates: Record<string, boolean>
  ) => Promise<void>;
}

// ── Store ──────────────────────────────────────────────────────────────
export const useConsentStore = create<ConsentState>()((set, get) => ({
  consents: {},

  loadConsents: async () => {
    const token = useAuthStore.getState().userToken?.token;

    try {
      // Try backend first if authenticated
      if (token) {
        try {
          const backendConsents = await getConsents(token);

          if (Object.keys(backendConsents.consents).length > 0) {
            set({ consents: backendConsents.consents });
            await AsyncStorage.setItem(
              CONSENT_STORAGE_KEY,
              JSON.stringify(backendConsents.consents)
            );
            return;
          } else {
            // Backend empty — check local consents to sync up
            const storedConsents = await AsyncStorage.getItem(
              CONSENT_STORAGE_KEY
            );
            if (storedConsents) {
              const parsedConsents = JSON.parse(storedConsents);
              set({ consents: parsedConsents });

              // Sync local consents to backend
              for (const [consentType, granted] of Object.entries(
                parsedConsents
              )) {
                try {
                  await updateConsentAPI(
                    consentType,
                    granted as boolean,
                    token
                  );
                } catch {}
              }
              return;
            }
          }
        } catch {
          // Fall back to local storage
        }
      }

      // Fallback to local storage
      const storedConsents = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsents) {
        set({ consents: JSON.parse(storedConsents) });
      } else {
        set({ consents: {} });
      }
    } catch {}
  },

  hasConsent: (consentType) => {
    return get().consents[consentType] ?? false;
  },

  updateConsent: async (consentType, granted) => {
    const token = useAuthStore.getState().userToken?.token;
    const previousConsents = get().consents;

    try {
      // Optimistic update
      const updatedConsents = { ...previousConsents, [consentType]: granted };
      set({ consents: updatedConsents });
      await AsyncStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(updatedConsents)
      );

      // Sync with backend if authenticated
      if (token) {
        try {
          await updateConsentAPI(consentType, granted, token);
          // Reload from backend to ensure sync
          const backendConsents = await getConsents(token);
          set({ consents: backendConsents.consents });
          await AsyncStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify(backendConsents.consents)
          );
        } catch {
          // Revert local state on backend error
          set({ consents: previousConsents });
        }
      }
    } catch {}
  },

  updateMultipleConsents: async (consentUpdates) => {
    const token = useAuthStore.getState().userToken?.token;

    try {
      const updatedConsents = { ...get().consents, ...consentUpdates };
      set({ consents: updatedConsents });
      await AsyncStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(updatedConsents)
      );

      // Sync with backend if authenticated
      if (token) {
        for (const [consentType, granted] of Object.entries(consentUpdates)) {
          try {
            await updateConsentAPI(consentType, granted, token);
          } catch {}
        }
      }
    } catch {}
  },
}));

// Initial load
useConsentStore.getState().loadConsents();

// ── Backward-compatible hook ───────────────────────────────────────────
export const useConsent = () => {
  const store = useConsentStore();
  return {
    consents: store.consents,
    hasConsent: store.hasConsent,
    updateConsent: store.updateConsent,
    updateMultipleConsents: store.updateMultipleConsents,
  };
};
