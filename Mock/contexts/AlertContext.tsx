/**
 * Alert system — Zustand-backed.
 *
 * State and actions live in `store/alertStore.ts`.
 * This file provides:
 *   1. `useAlert` — re-exported from the store (backward-compatible).
 *   2. `AlertPortal` — a thin React component that subscribes to the store
 *      and renders the `<CustomAlert>` modal. Must be mounted once in the
 *      React tree (inside `_layout.tsx`).
 *   3. `AlertProvider` — no-op wrapper kept temporarily for incremental
 *      migration. Will be removed in Phase 8.
 */
import React from "react";
import CustomAlert from "../components/CustomAlert";
import { useAlertStore } from "../store/alertStore";

// Re-export the hook so existing `import { useAlert } from "../contexts/AlertContext"` works
export { useAlert } from "../store/alertStore";

/**
 * Renders the `<CustomAlert>` overlay by subscribing to the Zustand store.
 * Mount this once as a sibling to `<Stack>` in `_layout.tsx`.
 */
export const AlertPortal: React.FC = () => {
  const { visible, options, hideAlert } = useAlertStore();

  return (
    <CustomAlert visible={visible} onDismiss={hideAlert} {...options} />
  );
};

/**
 * No-op provider kept temporarily so `_layout.tsx` compiles during
 * incremental migration. Remove after Phase 8.
 */
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    {children}
    <AlertPortal />
  </>
);
