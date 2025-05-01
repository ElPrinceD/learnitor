import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSQLiteContext, SQLiteDatabase } from 'expo-sqlite';
import { InteractionManager } from 'react-native';

interface CacheContextType {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<[string, string | null][]>;
}

const CacheContext = createContext<CacheContextType | null>(null);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db: SQLiteDatabase = useSQLiteContext();

  useEffect(() => {
    const manager = InteractionManager.runAfterInteractions(() => {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS storage (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `).catch(console.error);
    });

    return () => manager.cancel();
  }, [db]);

  const setItem = useCallback(
    
    async (key: string, value: string) => {
      
      await db.runAsync(
        'INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?);',
        [key, value]
      );
    },
    [db]
  );

  const getItem = useCallback(
    async (key: string) => {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM storage WHERE key = ?;',
        [key]
      );
      return row?.value ?? null;
    },
    [db]
  );

  const removeItem = useCallback(
    async (key: string) => {
      await db.runAsync('DELETE FROM storage WHERE key = ?;', [key]);
    },
    [db]
  );

  const clear = useCallback(async () => {
    await db.runAsync('DELETE FROM storage');
  }, [db]);

  const getAllKeys = useCallback(async () => {
    const rows = await db.getAllAsync<{ key: string }>('SELECT key FROM storage;');
    return rows.map((row) => row.key);
  }, [db]);

  const multiGet = useCallback(
    async (keys: string[]): Promise<[string, string | null][]> => {
      if (keys.length === 0) return [];

      const placeholders = keys.map(() => '?').join(',');
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM storage WHERE key IN (${placeholders});`,
        keys
      );

      const valueMap = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
      return keys.map((key) => [key, valueMap[key] ?? null]);
    },
    [db]
  );

  const contextValue = useMemo(
    () => ({
      setItem,
      getItem,
      removeItem,
      clear,
      getAllKeys,
      multiGet,
    }),
    [setItem, getItem, removeItem, clear, getAllKeys, multiGet]
  );

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};