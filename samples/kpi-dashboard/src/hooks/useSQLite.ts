import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';

export const useSQLite = (dbPath: string) => {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const response = await fetch(dbPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch database file: ${response.statusText}`);
        }
        const dbData = await response.arrayBuffer();
        const database = new SQL.Database(new Uint8Array(dbData));
        setDb(database);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, [dbPath]);

  return { db, error, loading };
};
