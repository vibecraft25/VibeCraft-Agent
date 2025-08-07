import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

const useSQLite = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const sqlPromise = initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const dataPromise = fetch('/data.sqlite').then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch database: ${res.statusText}`);
          }
          return res.arrayBuffer();
        });

        const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
        const database = new SQL.Database(new Uint8Array(buf));
        setDb(database);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load database');
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();

    return () => {
      db?.close();
    };
  }, []);

  return { db, error, loading };
};

export default useSQLite;
