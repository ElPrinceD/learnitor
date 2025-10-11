import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getConsents,
  updateConsent as updateConsentAPI,
  deleteConsents,
} from "../services/ConsentApiCalls";

import { useAuth } from "../components/AuthContext";

interface ConsentContextType {
  consents: Record<string, boolean>;
  hasConsent: (consentType: string) => boolean;
  updateConsent: (consentType: string, granted: boolean) => Promise<void>;
  updateMultipleConsents: (
    consentUpdates: Record<string, boolean>
  ) => Promise<void>;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const CONSENT_STORAGE_KEY = "user_consents";

export const ConsentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { userToken } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const loadConsents = async () => {
    try {
      // Try backend first if authenticated
      if (userToken?.token) {
        try {
          const backendConsents = await getConsents(userToken.token);

          // If backend has consents, use them
          if (Object.keys(backendConsents.consents).length > 0) {
            setConsents(backendConsents.consents);
            await AsyncStorage.setItem(
              CONSENT_STORAGE_KEY,
              JSON.stringify(backendConsents.consents)
            );
            return;
          } else {
            // Backend is empty, check if we have local consents to sync
            const storedConsents = await AsyncStorage.getItem(
              CONSENT_STORAGE_KEY
            );
            if (storedConsents) {
              const parsedConsents = JSON.parse(storedConsents);
              setConsents(parsedConsents);

              // Sync local consents to backend
              for (const [consentType, granted] of Object.entries(
                parsedConsents
              )) {
                try {
                  await updateConsentAPI(
                    consentType,
                    granted as boolean,
                    userToken.token
                  );
                } catch (error) {}
              }
              return;
            }
          }
        } catch (error) {
          // Fall back to local storage
        }
      }

      // Fallback to local storage
      const storedConsents = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsents) {
        const parsedConsents = JSON.parse(storedConsents);
        setConsents(parsedConsents);
      } else {
        setConsents({});
      }
    } catch (error) {}
  };

  const updateConsent = async (consentType: string, granted: boolean) => {
    try {
      // Update local state immediately for smooth UI
      const updatedConsents = {
        ...consents,
        [consentType]: granted,
      };

      setConsents(updatedConsents);
      await AsyncStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(updatedConsents)
      );

      // Try to sync with backend if authenticated
      if (userToken?.token) {
        try {
          await updateConsentAPI(consentType, granted, userToken.token);
          // Reload from backend to ensure sync
          const backendConsents = await getConsents(userToken.token);
          setConsents(backendConsents.consents);
          await AsyncStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify(backendConsents.consents)
          );
        } catch (error) {
          // Revert local state on backend error
          setConsents(consents);
        }
      }
    } catch (error) {}
  };

  const hasConsent = (consentType: string): boolean => {
    return consents[consentType] ?? false;
  };

  const updateMultipleConsents = async (
    consentUpdates: Record<string, boolean>
  ) => {
    try {
      // Update local state with all consents at once
      const updatedConsents = {
        ...consents,
        ...consentUpdates,
      };

      setConsents(updatedConsents);
      await AsyncStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(updatedConsents)
      );

      // Try to sync with backend if authenticated (individual calls)
      if (userToken?.token) {
        for (const [consentType, granted] of Object.entries(consentUpdates)) {
          try {
            await updateConsentAPI(consentType, granted, userToken.token);
          } catch (error) {}
        }
      }
    } catch (error) {}
  };

  useEffect(() => {
    loadConsents();
  }, []);

  // Reload consents when user token changes
  useEffect(() => {
    if (userToken?.token) {
      loadConsents();
    }
  }, [userToken?.token]);

  const value: ConsentContextType = {
    consents,
    hasConsent,
    updateConsent,
    updateMultipleConsents,
  };

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};
