import { query } from "../../config/database.js";
import { SearchHistoryRow } from "../../types/domain.js";

export async function listSearchHistory(userId: string) {
  const result = await query<SearchHistoryRow>(
    `
      select id, user_id, query, filters, latitude, longitude, created_at
      from search_history
      where user_id = $1
      order by created_at desc
      limit 100
    `,
    [userId]
  );

  return result.rows;
}

export async function deleteSearchHistory(userId: string) {
  await query(
    `
      delete from search_history
      where user_id = $1
    `,
    [userId]
  );
}
