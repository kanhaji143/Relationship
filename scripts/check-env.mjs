#!/usr/bin/env node
/**
 * Phase 0 environment check.
 *
 * Verifies that `.env.local` exists, that every key documented in
 * `.env.example` is present, and reports whether Firebase client config is
 * filled in. Prints key names only — never values.
 *
 * Usage: npm run env:check
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const examplePath = resolve(root, ".env.example");
const localPath = resolve(root, ".env.local");

function parseEnvFile(path) {
  const entries = new Map();
  if (!existsSync(path)) return entries;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    entries.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return entries;
}

const example = parseEnvFile(examplePath);
const local = parseEnvFile(localPath);

if (example.size === 0) {
  console.error(`✖ Could not read expected keys from ${examplePath}`);
  process.exit(1);
}

if (!existsSync(localPath)) {
  console.error("✖ .env.local is missing.");
  console.error("  Run: npm run setup:env   (or copy .env.example to .env.local)");
  process.exit(1);
}

const missing = [...example.keys()].filter((key) => !local.has(key));
if (missing.length > 0) {
  console.warn(`⚠ ${missing.length} key(s) from .env.example missing in .env.local:`);
  for (const key of missing) console.warn(`  - ${key}`);
}

const firebaseKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
];
const configured = firebaseKeys.filter((key) => (local.get(key) ?? "") !== "");
const empty = firebaseKeys.filter((key) => (local.get(key) ?? "") === "");

console.log(`✔ .env.local found (${local.size} keys)`);
console.log(`  Firebase client config: ${configured.length}/${firebaseKeys.length} filled`);
if (empty.length > 0) {
  console.log("  Still empty:", empty.join(", "));
  console.log(
    "  → The app boots without Firebase, but auth features need these (docs/SETUP_FIREBASE.md).",
  );
}
if (missing.length > 0) process.exitCode = 1;
