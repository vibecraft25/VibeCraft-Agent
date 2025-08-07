import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';

export const useDatabase = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const response = await fetch('/data.sqlite');
        if (!response.ok) {
          throw new Error(`Failed to fetch database file: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const database = new SQL.Database(new Uint8Array(buffer));
        setDb(database);
      } catch (err) {
        console.error("Database loading error:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    loadDatabase();
  }, []);

  return { db, error };
};
