/**
 * Backward-compatibility shim.
 *
 * Alert logic now lives in `store/alertStore.ts` (Zustand).
 * This file re-exports types so that any remaining imports compile.
 */
export type { AlertOptions, AlertButton } from "../store/alertStore";
export { useAlert as useCustomAlert } from "../store/alertStore";
