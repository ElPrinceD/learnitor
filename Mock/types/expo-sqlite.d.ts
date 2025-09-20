declare module 'expo-sqlite' {
  export interface SQLiteProviderProps {
    databaseName: string;
    children: React.ReactNode;
  }
  
  export const SQLiteProvider: React.ComponentType<SQLiteProviderProps>;
}
