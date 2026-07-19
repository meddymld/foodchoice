import { createClient } from "@supabase/supabase-js";

function requiredPublicEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

export const supabase = createClient(
  requiredPublicEnv("EXPO_PUBLIC_SUPABASE_URL"),
  requiredPublicEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  }
);

export function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password
  });
}

export function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

export function signInWithGoogle(redirectTo?: string) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
}

export function signInWithApple(redirectTo?: string) {
  return supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo
    }
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export async function getAccessToken() {
  const { data } = await getSession();
  return data.session?.access_token ?? null;
}
