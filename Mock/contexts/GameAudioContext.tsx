/**
 * Backward-compatibility shim.
 *
 * Game audio state now lives in `store/gameAudioStore.ts` (Zustand).
 * This file re-exports the same public API.
 */
import React, { useEffect } from "react";
import { useGameAudioStore } from "../store/gameAudioStore";

export { useGameAudio } from "../store/gameAudioStore";

/**
 * Thin provider that initializes audio players on mount and cleans up
 * on unmount. Kept as a wrapper so the layout tree compiles during
 * incremental migration — will be removed in Phase 8.
 */
export const GameAudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const cleanup = useGameAudioStore.getState().initAudio();
    return cleanup;
  }, []);

  return <>{children}</>;
};
