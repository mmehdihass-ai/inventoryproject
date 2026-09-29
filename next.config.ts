import type { NextConfig } from "next";

const supabaseHostnames = [
  process.env.NEXT_PUBLIC_SUPABASE_URL_TEST,
  process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
]
  .filter((url): url is string => Boolean(url))
  .map((url) => new URL(url).hostname);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostnames.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/storage/v1/object/public/**",
    })),
  },
};

export default nextConfig;
