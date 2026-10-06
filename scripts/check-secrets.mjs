// Fails if the Supabase service-role key could reach the browser or leak into shared code.
// Usage: npm run check:secrets
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "hooks", "types", "utils", "middleware.ts"];
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
// The only file allowed to read the key, and it must be server-only.
const ALLOWED = ["lib/supabase/admin.ts"];

function* walk(path) {
  if (!existsSync(path)) return;
  if (statSync(path).isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    yield* walk(join(path, entry.name));
  }
}

const problems = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (!EXTENSIONS.test(file)) continue;
    const rel = relative(ROOT, file).split(sep).join("/");
    const text = readFileSync(file, "utf8");

    if (/NEXT_PUBLIC_[A-Z_]*SERVICE/i.test(text)) {
      problems.push(`${rel}: a NEXT_PUBLIC_ variable that looks like a service key`);
    }
    if (/SERVICE_ROLE/i.test(text)) {
      if (!ALLOWED.includes(rel)) problems.push(`${rel}: references the service-role key outside ${ALLOWED.join(", ")}`);
      else if (!/import\s+["']server-only["']/.test(text)) problems.push(`${rel}: must start with import "server-only"`);
      if (/^\s*["']use client["']/m.test(text)) problems.push(`${rel}: a client component must not touch the service-role key`);
    }
  }
}

if (problems.length) {
  console.error("Secret-handling problems found:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log("check:secrets OK — the service-role key is not referenced by client-reachable code.");
