#!/usr/bin/env node
/**
 * Creates `.env.local` from `.env.example` when it does not exist yet.
 * Never overwrites an existing file (it may hold real local values).
 */

import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const examplePath = resolve(root, ".env.example");
const localPath = resolve(root, ".env.local");

if (existsSync(localPath)) {
  console.log("• .env.local already exists — left untouched.");
} else {
  copyFileSync(examplePath, localPath);
  console.log("✔ Created .env.local from .env.example");
  console.log("  Fill the NEXT_PUBLIC_FIREBASE_* values (docs/SETUP_FIREBASE.md).");
}
