import pg, { QueryResultRow } from "pg";

import { env } from "./env.js";

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === "production"
      ? {
          rejectUnauthorized: false
        }
      : undefined
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  return pool.query<T>(text, values);
}
