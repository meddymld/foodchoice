import { getAccessToken } from "./supabaseAuth";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!apiUrl) {
    throw new Error("Missing required public environment variable: EXPO_PUBLIC_API_URL");
  }

  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers
  });
}
