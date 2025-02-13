import * as SQLite from "expo-sqlite";

// Cast to any to work around missing type definitions.
const db: any = SQLite.openDatabaseSync("myDatabase.db");

// Initialize the database by creating a key-value storage table.
const initDB = () => {
  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS storage (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );`,
      [],
      () => {
        console.log("Storage table created or already exists.");
      },
      (_, error: any) => {
        console.error("Error creating storage table", error);
        return false;
      }
    );
  });
};

// Run the initialization immediately.
initDB();

export const getItem = (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT value FROM storage WHERE key = ?;`,
        [key],
        (_, { rows }: any) => {
          if (rows.length > 0) {
            resolve(rows.item(0).value);
          } else {
            resolve(null);
          }
        },
        (_, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const setItem = (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?);`,
        [key, value],
        () => {
          resolve();
        },
        (_, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const removeItem = (key: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `DELETE FROM storage WHERE key = ?;`,
        [key],
        () => {
          resolve();
        },
        (_, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getAllKeys = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT key FROM storage;`,
        [],
        (_, { rows }: any) => {
          const keys: string[] = [];
          for (let i = 0; i < rows.length; i++) {
            keys.push(rows.item(i).key);
          }
          resolve(keys);
        },
        (_, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const multiGet = (keys: string[]): Promise<[string, string | null][]> => {
  return new Promise((resolve, reject) => {
    if (keys.length === 0) {
      resolve([]);
      return;
    }
    const placeholders = keys.map(() => "?").join(",");
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT key, value FROM storage WHERE key IN (${placeholders});`,
        keys,
        (_, { rows }: any) => {
          const results: { [key: string]: string | null } = {};
          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            results[item.key] = item.value;
          }
          // Return results in the same order as the provided keys.
          const output = keys.map(
            (key) => [key, results[key] || null] as [string, string | null]
          );
          resolve(output);
        },
        (_, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
};
