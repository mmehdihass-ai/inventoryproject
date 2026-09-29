export type SupabaseEnv = "test" | "prod";

export const ENV_COOKIE_NAME = "app-env";
export const DEFAULT_ENV: SupabaseEnv = "test";

export function parseEnv(value: string | undefined | null): SupabaseEnv {
  return value === "prod" ? "prod" : DEFAULT_ENV;
}

export function getSupabaseCredentials(env: SupabaseEnv): {
  url: string;
  anonKey: string;
} {
  if (env === "prod") {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD!,
    };
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_TEST!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST!,
  };
}

/** Browser-only: reads the env cookie via document.cookie (not httpOnly by design). */
export function getClientEnv(): SupabaseEnv {
  if (typeof document === "undefined") return DEFAULT_ENV;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ENV_COOKIE_NAME}=([^;]*)`),
  );
  return parseEnv(match ? decodeURIComponent(match[1]) : undefined);
}
