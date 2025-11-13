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
    const LOAD_TIMEOUT = 3000; // 3 second timeout for consent loading
    const startTime = Date.now();
    
    console.log("[ConsentContext] Starting to load consents");
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Consent loading timeout"));
        }, LOAD_TIMEOUT);
      });

      // Try backend first if authenticated
      if (userToken?.token) {
        try {
          console.log("[ConsentContext] Fetching consents from backend");
          const backendConsents = await Promise.race([
            getConsents(userToken.token),
            timeoutPromise,
          ]);

          // If backend has consents, use them
          if (Object.keys(backendConsents.consents).length > 0) {
            setConsents(backendConsents.consents);
            try {
              await Promise.race([
                AsyncStorage.setItem(
                  CONSENT_STORAGE_KEY,
                  JSON.stringify(backendConsents.consents)
                ),
                timeoutPromise,
              ]);
            } catch (storageError) {
              console.warn("[ConsentContext] Failed to save consents to storage:", storageError);
            }
            const elapsed = Date.now() - startTime;
            console.log(`[ConsentContext] Consents loaded from backend in ${elapsed}ms`);
            return;
          } else {
            // Backend is empty, check if we have local consents to sync
            try {
              const storedConsents = await Promise.race([
                AsyncStorage.getItem(CONSENT_STORAGE_KEY),
                timeoutPromise,
              ]);
              if (storedConsents) {
                const parsedConsents = JSON.parse(storedConsents);
                setConsents(parsedConsents);

                // Sync local consents to backend (non-blocking)
                Promise.all(
                  Object.entries(parsedConsents).map(([consentType, granted]) =>
                    updateConsentAPI(
                      consentType,
                      granted as boolean,
                      userToken.token
                    ).catch(() => {}) // Silent failure for sync
                  )
                ).catch(() => {}); // Don't block on sync
                
                const elapsed = Date.now() - startTime;
                console.log(`[ConsentContext] Consents loaded from local storage in ${elapsed}ms`);
                return;
              }
            } catch (storageError) {
              console.warn("[ConsentContext] Failed to read local consents:", storageError);
            }
          }
        } catch (error) {
          console.warn("[ConsentContext] Backend consent fetch failed, falling back to local:", error);
          // Fall back to local storage
        }
      }

      // Fallback to local storage
      try {
        const storedConsents = await Promise.race([
          AsyncStorage.getItem(CONSENT_STORAGE_KEY),
          timeoutPromise,
        ]);
        if (storedConsents) {
          const parsedConsents = JSON.parse(storedConsents);
          setConsents(parsedConsents);
          const elapsed = Date.now() - startTime;
          console.log(`[ConsentContext] Consents loaded from local storage (fallback) in ${elapsed}ms`);
        } else {
          setConsents({});
          const elapsed = Date.now() - startTime;
          console.log(`[ConsentContext] No consents found, using empty object in ${elapsed}ms`);
        }
      } catch (error) {
        console.warn("[ConsentContext] Failed to load consents, using empty object:", error);
        setConsents({});
      }
    } catch (error) {
      console.error("[ConsentContext] Error loading consents:", error);
      setConsents({}); // Always set empty object on error
    }
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
    // Load consents asynchronously without blocking
    loadConsents().catch((error) => {
      console.error("[ConsentContext] Unhandled error in loadConsents:", error);
      setConsents({});
    });
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
