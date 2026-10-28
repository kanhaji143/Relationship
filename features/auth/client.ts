"use client";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { getFirebaseClientAuth } from "@/lib/firebase/client/app";

/** Client-side Firebase Auth calls. Never stores tokens in browser storage. */

export type RegisterPayload = {
  adultConfirmed: true;
  acceptedTerms: true;
  acceptedPrivacy: true;
  locale: string;
  policyVersion: string;
};

async function idTokenFor(
  action: (
    auth: ReturnType<typeof getFirebaseClientAuth>,
  ) => Promise<{ user: { getIdToken(): Promise<string> } }>,
): Promise<string> {
  const credential = await action(getFirebaseClientAuth());
  return credential.user.getIdToken();
}

export function signInWithEmail(email: string, password: string): Promise<string> {
  return idTokenFor((auth) => signInWithEmailAndPassword(auth, email, password));
}

export function signUpWithEmail(email: string, password: string): Promise<string> {
  return idTokenFor((auth) => createUserWithEmailAndPassword(auth, email, password));
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseClientAuth(), email);
}

export async function signOutClient(): Promise<void> {
  await signOut(getFirebaseClientAuth());
}

async function postJson(path: string, body: unknown, idToken?: string): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
}

export async function exchangeSession(idToken: string): Promise<Response> {
  return postJson("/api/auth/session", { idToken });
}

export async function registerAccount(
  idToken: string,
  payload: RegisterPayload,
): Promise<Response> {
  return postJson("/api/auth/register", payload, idToken);
}

export async function endSession(): Promise<Response> {
  return fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
}
