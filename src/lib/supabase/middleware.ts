import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ENV_COOKIE_NAME, parseEnv, getSupabaseCredentials } from "@/lib/env-config";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];
// Reachable regardless of auth state — a password-recovery link may load
// while an old session cookie is still present.
const NEUTRAL_ROUTES = ["/reset-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = parseEnv(request.cookies.get(ENV_COOKIE_NAME)?.value);
  const { url: supabaseUrl, anonKey } = getSupabaseCredentials(env);

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);
  const isNeutralRoute = NEUTRAL_ROUTES.includes(path);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute && !isNeutralRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
