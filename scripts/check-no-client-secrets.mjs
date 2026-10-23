import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const dist = join(root, "dist");

function readDotEnvSecret() {
  if (process.env.N8N_SHARED_SECRET) return process.env.N8N_SHARED_SECRET.trim();
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return "";
  const match = readFileSync(envPath, "utf8").match(/^\s*N8N_SHARED_SECRET\s*=\s*(.+)\s*$/m);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

if (!existsSync(dist)) {
  console.error("dist/ not found. Run npm run build first.");
  process.exit(1);
}

const secret = readDotEnvSecret();
const forbidden = [
  "VITE_N8N_SHARED_SECRET",
  "sk_live_",
  "sk_test_",
  "whsec_",
  "-----BEGIN PRIVATE KEY-----"
].filter(Boolean);
if (secret && secret.length >= 16) forbidden.push(secret);

const findings = [];
for (const file of walk(dist)) {
  if (!/\.(js|mjs|css|html|json|map|txt)$/i.test(file)) continue;
  const contents = readFileSync(file, "utf8");
  for (const needle of forbidden) {
    if (contents.includes(needle)) {
      findings.push(`${relative(root, file)} contains ${needle === secret ? "the N8N_SHARED_SECRET value" : needle}`);
    }
  }
}

if (!secret) {
  console.warn("N8N_SHARED_SECRET not set in env or .env.local; literal-value scan skipped.");
}

if (findings.length) {
  console.error("Potential client secret exposure:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Scanned ${walk(dist).length} build files; no client secret patterns found.`);
