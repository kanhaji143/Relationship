import "server-only";

import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Firebase Admin SDK — server only.
 *
 * Credentials resolve in this order:
 * 1. `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` (local dev only, gitignored).
 * 2. Application Default Credentials (Firebase App Hosting / Cloud Functions / `gcloud auth`).
 *
 * When the Firebase Emulator Suite is running, the Admin SDK talks to it
 * automatically via the *_EMULATOR_HOST environment variables.
 */

export const EMULATOR_PROJECT_ID = "demo-bondora";

function resolveCredential() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH?.trim();
  if (keyPath) return cert(keyPath);
  return applicationDefault();
}

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return existing;
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    (process.env.FIRESTORE_EMULATOR_HOST ? EMULATOR_PROJECT_ID : undefined);

  adminApp = initializeApp({
    credential: resolveCredential(),
    ...(projectId ? { projectId } : {}),
    ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
      : {}),
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let adminDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  // Note: no db.settings() here. Next bundles may load this module multiple
  // times, and settings() can only be applied once per Firestore instance —
  // it also rejects the second call. Writes are schema-validated upstream, so
  // `ignoreUndefinedProperties` is unnecessary.
  adminDb ??= getFirestore(getAdminApp());
  return adminDb;
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
