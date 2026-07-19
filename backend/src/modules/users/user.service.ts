import { User } from "@supabase/supabase-js";

import { query } from "../../config/database.js";

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
};

export async function getOrCreateProfile(user: User) {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const result = await query<ProfileRow>(
    `
      insert into profiles (id, username, full_name, avatar_url)
      values ($1, $2, $3, $4)
      on conflict (id) do update
        set full_name = coalesce(profiles.full_name, excluded.full_name),
            avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
            updated_at = now()
      returning id, username, full_name, avatar_url, created_at, updated_at
    `,
    [user.id, user.email ?? null, fullName, avatarUrl]
  );

  return result.rows[0];
}

export async function getMe(user: User) {
  const profile = await getOrCreateProfile(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    },
    profile
  };
}
