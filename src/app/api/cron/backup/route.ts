import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET = "backups";

// Full-table dump, in dependency order. Not a real point-in-time database
// backup (no schema, no restore tooling) — a nightly safety net against
// accidental mutation/deletion, per the tradeoffs already discussed with
// the user (see project notes). Always targets Production; Test data is
// disposable by design and isn't backed up.
const TABLES = [
  "products",
  "customers",
  "sales",
  "sale_items",
  "returns",
  "return_items",
  "inventory_transactions",
] as const;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_PROD!,
    process.env.SUPABASE_SERVICE_ROLE_KEY_PROD!,
  );

  const backup: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
  };

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      return NextResponse.json(
        { error: `Failed to export "${table}": ${error.message}` },
        { status: 500 },
      );
    }
    backup[table] = data;
  }

  const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, JSON.stringify(backup, null, 2), {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, filename });
}
