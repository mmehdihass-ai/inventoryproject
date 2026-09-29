import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv, getSupabaseCredentials } from "@/lib/env-config";

export function createClient() {
  const { url, anonKey } = getSupabaseCredentials(getClientEnv());
  // isSingleton: false — createBrowserClient otherwise caches the first
  // client it ever builds and ignores the url/key on later calls, which
  // would pin every call to whichever environment was active on first use.
  return createBrowserClient(url, anonKey, { isSingleton: false });
}
