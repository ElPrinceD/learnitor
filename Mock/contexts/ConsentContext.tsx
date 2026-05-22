/**
 * Backward-compatibility shim.
 *
 * Consent state now lives in `store/consentStore.ts` (Zustand).
 * This file re-exports the same public API.
 */
import React, { useEffect } from "react";
import { useConsentStore, useConsent } from "../store/consentStore";
import { useAuthStore } from "../store/authStore";

export { useConsent } from "../store/consentStore";

/**
 * No-op provider that re-loads consents when the auth token changes.
 * Kept temporarily so `_layout.tsx` compiles during incremental migration.
 */
export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = useAuthStore((s) => s.userToken?.token);

  useEffect(() => {
    if (token) {
      useConsentStore.getState().loadConsents();
    }
  }, [token]);

  return <>{children}</>;
};
