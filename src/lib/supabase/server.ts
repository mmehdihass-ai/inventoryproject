import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ENV_COOKIE_NAME, parseEnv, getSupabaseCredentials } from "@/lib/env-config";

export async function createClient() {
  const cookieStore = await cookies();
  const env = parseEnv(cookieStore.get(ENV_COOKIE_NAME)?.value);
  const { url, anonKey } = getSupabaseCredentials(env);

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore since
          // proxy.ts already refreshes the session on every request.
        }
      },
    },
  });
}
