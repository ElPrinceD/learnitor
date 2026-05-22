/**
 * Backward-compatibility shim.
 *
 * Cache state now lives in `store/cacheStore.ts` (Zustand).
 * This file provides:
 *   1. `useCache` — re-exported from the store.
 *   2. `CacheInitializer` — a thin React component that bridges the
 *      SQLite context to the Zustand store. Must be mounted inside
 *      `<SQLiteProvider>`.
 *   3. `CacheProvider` — no-op wrapper kept temporarily.
 */
import React, { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useCacheStore } from "../store/cacheStore";

export { useCache } from "../store/cacheStore";

/**
 * Bridges the React `SQLiteProvider` tree to the Zustand cache store.
 * Mount once inside `<SQLiteProvider>`.
 */
export const CacheInitializer: React.FC = () => {
  const db = useSQLiteContext();

  useEffect(() => {
    useCacheStore.getState().initDb(db);
  }, [db]);

  return null;
};

/**
 * No-op provider kept temporarily so `_layout.tsx` compiles during
 * incremental migration. Includes `<CacheInitializer>` so the store
 * gets initialized.
 */
export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <CacheInitializer />
    {children}
  </>
);
