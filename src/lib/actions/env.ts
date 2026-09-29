"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ENV_COOKIE_NAME, type SupabaseEnv } from "@/lib/env-config";

export async function switchEnvironment(env: SupabaseEnv) {
  const cookieStore = await cookies();
  // Not httpOnly: the browser Supabase client (file uploads, client-side
  // RPCs) reads this cookie directly to pick which project to talk to.
  cookieStore.set(ENV_COOKIE_NAME, env, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/dashboard");
}
