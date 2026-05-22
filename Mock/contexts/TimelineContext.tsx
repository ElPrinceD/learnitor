/**
 * Backward-compatibility shim.
 *
 * Timeline state now lives in `store/timelineStore.ts` (Zustand).
 * This file re-exports the same public API.
 */
import React from "react";

export { useTimeline } from "../store/timelineStore";

/**
 * No-op provider kept temporarily so `_layout.tsx` compiles during
 * incremental migration. The `token` prop is now unused — the store
 * reads from the cache store directly.
 */
export const TimelineProvider: React.FC<{
  token: string | null;
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;
