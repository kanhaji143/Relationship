import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase client SDK singletons.
 *
 * Import only from Client Components. Direct Firestore/Storage access is
 * denied by rules; these instances exist for Auth (Phase 1) and for
 * Functions-issued signed URLs, never for privileged reads/writes.
 */

const EMULATOR_HOST = "127.0.0.1";

export function getFirebaseClientConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) return null;

  return {
    apiKey,
    projectId,
    appId,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  };
}

export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}

export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();

  const config = getFirebaseClientConfig();
  if (!config) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local (see docs/SETUP_FIREBASE.md).",
    );
  }
  return initializeApp(config);
}

let authSingleton: Auth | null = null;
let authEmulatorConnected = false;

export function getFirebaseClientAuth(): Auth {
  authSingleton ??= getAuth(getFirebaseClientApp());

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    !authEmulatorConnected
  ) {
    connectAuthEmulator(authSingleton, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
    authEmulatorConnected = true;
  }
  return authSingleton;
}

let firestoreSingleton: Firestore | null = null;
let firestoreEmulatorConnected = false;

export function getFirebaseClientFirestore(): Firestore {
  firestoreSingleton ??= getFirestore(getFirebaseClientApp());

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    !firestoreEmulatorConnected
  ) {
    connectFirestoreEmulator(firestoreSingleton, EMULATOR_HOST, 8080);
    firestoreEmulatorConnected = true;
  }
  return firestoreSingleton;
}
