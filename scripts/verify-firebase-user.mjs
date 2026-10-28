#!/usr/bin/env node
/**
 * Read-only verification for one explicitly supplied Firebase E2E account.
 * Output is PII-minimized: no UID, email, DOB, token or credential is printed.
 *
 * Run with FIREBASE_E2E_UID set and valid local ADC/Admin SDK credentials.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const uid = process.env.FIREBASE_E2E_UID;

if (!projectId || !uid) {
  console.error("Missing project config or FIREBASE_E2E_UID; values are intentionally not echoed.");
  process.exit(2);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

async function main() {
  const [authUser, user, profile, preferences, privateAge, consents, audits] = await Promise.all([
    getAuth().getUser(uid),
    db.doc(`users/${uid}`).get(),
    db.doc(`profiles/${uid}`).get(),
    db.doc(`preferences/${uid}`).get(),
    db.doc(`users/${uid}/private/ageAssurance`).get(),
    db.collection("consentRecords").where("uid", "==", uid).get(),
    db.collection("auditLogs").where("actorUid", "==", uid).get(),
  ]);

  const profileData = profile.data() ?? {};
  const privateData = privateAge.data() ?? {};
  const purposes = consents.docs.map((doc) => doc.get("purpose")).sort();
  const actions = audits.docs.map((doc) => doc.get("action")).sort();
  const emailLookupKey = createHash("sha256")
    .update((authUser.email ?? "").trim().toLowerCase(), "utf8")
    .digest("hex");
  const emailLookup = await db.doc(`emailLookup/${emailLookupKey}`).get();

  const checks = {
    firebaseAuthUserExists: Boolean(authUser.uid),
    accountDocumentExists: user.exists && user.get("accountStatus") === "active",
    profileDocumentExists: profile.exists && typeof profileData.displayName === "string",
    preferencesDocumentExists: preferences.exists,
    emailLookupEntryExists: emailLookup.exists && emailLookup.get("uid") === uid,
    exactDobHiddenFromPublicProfile: profileData.birthDate === null,
    exactDobStoredInPrivateDocument: typeof privateData.birthDate === "string",
    profileCreatedAtMs: profileData.createdAt?.toMillis?.() ?? null,
    ageAssuranceSelfDeclared: privateData.ageAssurance?.method === "self_declared",
    consentRecordsPresent: ["age_assurance", "privacy_policy", "terms_of_service"].every((p) =>
      purposes.includes(p),
    ),
    registrationAndOnboardingAudited:
      actions.includes("auth.register") && actions.includes("profile.onboarding_completed"),
  };
  const passed = Object.values(checks).every(Boolean);

  console.log(JSON.stringify({ status: passed ? "PASS" : "FAIL", checks }, null, 2));
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  // Error names/codes are safe; never include credentials, ids or raw values.
  console.error(
    JSON.stringify({
      status: "ERROR",
      code: typeof error?.code === "string" ? error.code : "unknown",
      name: error instanceof Error ? error.name : "unknown",
    }),
  );
  process.exit(1);
});
