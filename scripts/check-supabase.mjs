/**
 * Verifies the Supabase connection end to end, without starting the app.
 *
 *   node scripts/check-supabase.mjs
 *
 * Checks three things in order, because each one only makes sense if the
 * previous passed: the env vars exist, the key reaches the project, and the tables exist.
 *
 * Nothing is written and no row is printed.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* Next loads .env.local itself; a standalone script has to do it. */
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Absent is fine — the value may come from the real environment.
  }
}

const ok = (m) => console.log("  ✓ " + m);
const bad = (m) => { console.error("  ✗ " + m); process.exitCode = 1; };

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\nMilagro Universe → Supabase\n");

if (!url || !key) {
  bad("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both set.");
  console.error("\n    The app will fall back to the JSON file store, which is");
  console.error("    development only and does not work on Vercel.\n");
  process.exit(1);
}
ok(`env vars present (project ${new URL(url).hostname.split(".")[0]})`);

if (/^eyJ/.test(key) && /"role":"anon"/.test(Buffer.from(key.split(".")[1] ?? "", "base64").toString())) {
  bad("That is the ANON key. The server needs the SERVICE ROLE key.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

for (const table of ["users", "accounts"]) {
  const { error, count } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    bad(`table "${table}" unreachable: ${error.message}`);
    if (error.code === "42P01") {
      console.error("\n    Run supabase/migrations/0001_users_and_accounts.sql");
      console.error("    in the Supabase SQL editor first.\n");
    }
    process.exit(1);
  }
  ok(`table "${table}" reachable (${count} row${count === 1 ? "" : "s"})`);
}

console.log("\nConnected. The app will use Supabase, not the file store.\n");
