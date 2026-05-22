import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';

// ── Types ──────────────────────────────────────────────────────────────
interface CacheState {
  /** The underlying SQLite database reference. Set once via `initDb`. */
  db: SQLiteDatabase | null;

  // Actions
  /** Bridge initializer — call from a React component that has
   *  access to `useSQLiteContext()`. Must be called exactly once. */
  initDb: (db: SQLiteDatabase) => void;
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<[string, string | null][]>;
}

// ── Helpers ────────────────────────────────────────────────────────────
const getDb = (state: CacheState): SQLiteDatabase => {
  if (!state.db) {
    throw new Error(
      'CacheStore: db not initialized. Ensure <CacheInitializer /> is mounted inside <SQLiteProvider>.'
    );
  }
  return state.db;
};

// ── Store ──────────────────────────────────────────────────────────────
export const useCacheStore = create<CacheState>()((set, get) => ({
  db: null,

  initDb: (db) => {
    set({ db });
    // Create the storage table eagerly on init
    db.execAsync(
      `CREATE TABLE IF NOT EXISTS storage (
         key TEXT PRIMARY KEY NOT NULL,
         value TEXT
       );`
    ).catch(() => {});
  },

  setItem: async (key, value) => {
    const db = getDb(get());
    await db.runAsync(
      'INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?);',
      [key, value]
    );
  },

  getItem: async (key) => {
    const db = getDb(get());
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM storage WHERE key = ?;',
      [key]
    );
    return row?.value ?? null;
  },

  removeItem: async (key) => {
    const db = getDb(get());
    await db.runAsync('DELETE FROM storage WHERE key = ?;', [key]);
  },

  clear: async () => {
    try {
      const db = getDb(get());
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS storage (
           key TEXT PRIMARY KEY NOT NULL,
           value TEXT
         );`
      );
      await db.runAsync('DELETE FROM storage');
    } catch {
      // Best-effort on logout: Android can NPE if native DB is tearing down
    }
  },

  getAllKeys: async () => {
    const db = getDb(get());
    const rows = await db.getAllAsync<{ key: string }>(
      'SELECT key FROM storage;'
    );
    return rows.map((row) => row.key);
  },

  multiGet: async (keys) => {
    if (keys.length === 0) return [];

    const db = getDb(get());
    const placeholders = keys.map(() => '?').join(',');
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value FROM storage WHERE key IN (${placeholders});`,
      keys
    );

    const valueMap = Object.fromEntries(
      rows.map(({ key, value }) => [key, value])
    );
    return keys.map((key) => [key, valueMap[key] ?? null]);
  },
}));

// ── Backward-compatible hook ───────────────────────────────────────────
export const useCache = () => {
  const store = useCacheStore();
  return {
    setItem: store.setItem,
    getItem: store.getItem,
    removeItem: store.removeItem,
    clear: store.clear,
    getAllKeys: store.getAllKeys,
    multiGet: store.multiGet,
  };
};
