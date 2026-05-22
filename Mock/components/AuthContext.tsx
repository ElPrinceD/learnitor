/**
 * Backward-compatibility shim.
 *
 * All auth state now lives in `store/authStore.ts` (Zustand).
 * This file re-exports the same public API so that existing imports
 *   `import { useAuth } from "../components/AuthContext"`
 * continue to work without any consumer changes.
 *
 * The `AuthProvider` is kept as a no-op wrapper so the layout tree
 * compiles — it will be removed from `_layout.tsx` in Phase 8.
 */
import React from "react";
export {
  useAuth,
  useAuthStore,
  type UserToken,
  type UserInfo,
  type Address,
} from "../store/authStore";

/**
 * No-op provider kept temporarily so `_layout.tsx` doesn't break
 * during incremental migration. Remove after Phase 8.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
