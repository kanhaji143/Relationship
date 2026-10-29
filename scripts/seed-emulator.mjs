#!/usr/bin/env node
/**
 * Fictional seed importer for the local Firebase Emulator only.
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-bondora \
 *     node --env-file-if-exists=.env.local scripts/seed-emulator.mjs
 *
 * Every record is fictional. The script refuses to run unless the Firestore
 * emulator host is set and the project is the demo project.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const EXPECTED_PROJECT = "demo-bondora";
const root = dirname(fileURLToPath(import.meta.url));
const seedDir = join(root, "..", "firestore", "seed");

function load(name) {
  return JSON.parse(readFileSync(join(seedDir, name), "utf8"));
}

function blockId(blockerUid, blockedUid) {
  return createHash("sha256")
    .update(JSON.stringify([blockerUid, blockedUid]))
    .digest("hex");
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!emulatorHost) {
  console.error("FIRESTORE_EMULATOR_HOST is required; refusing to run against a live project.");
  process.exit(2);
}
if (projectId !== EXPECTED_PROJECT) {
  console.error(`Refusing to seed project "${projectId}"; expected "${EXPECTED_PROJECT}".`);
  process.exit(2);
}

const app = initializeApp({ projectId }, `seed-emulator-${Date.now()}`);
const db = getFirestore(app);
const now = Timestamp.fromDate(new Date("2026-10-29T12:00:00.000Z"));

function toTimestamp(value) {
  return value ? Timestamp.fromDate(new Date(value)) : now;
}

async function seed() {
  const users = load("users.json");
  const profiles = load("profiles.json");
  const preferences = load("preferences.json");
  const ageDocs = load("ageAssurance.json");
  const blocks = load("blocks.json");
  const matches = load("matches.json");
  const conversations = load("conversations.json");
  const messages = load("messages.json");
  const reports = load("reports.json");

  const batch = db.batch();

  for (const user of users) {
    batch.set(db.doc(`users/${user.uid}`), {
      uid: user.uid,
      emailNormalized: user.emailNormalized,
      accountStatus: user.accountStatus,
      role: user.role,
      emailVerifiedAt: toTimestamp(user.emailVerifiedAt),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
    batch.set(db.doc(`users/${user.uid}/private/ageAssurance`), {
      birthDate: ageDocs.find((entry) => entry.uid === user.uid)?.birthDate ?? null,
      ageAssurance: { method: "self_declared", status: "unverified", verifiedAt: null },
      updatedAt: now,
    });
  }

  for (const profile of profiles) {
    batch.set(db.doc(`profiles/${profile.uid}`), {
      ...profile,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const preference of preferences) {
    batch.set(db.doc(`preferences/${preference.uid}`), {
      ...preference,
      updatedAt: now,
    });
  }

  for (const block of blocks) {
    batch.set(db.collection("blocks").doc(blockId(block.blockerUid, block.blockedUid)), {
      blockerUid: block.blockerUid,
      blockedUid: block.blockedUid,
      createdAt: now,
    });
  }

  for (const match of matches) {
    batch.set(db.doc(`matches/${match.matchId}`), {
      userA: match.userA,
      userB: match.userB,
      status: match.status,
      matchedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const conversation of conversations) {
    batch.set(db.doc(`conversations/${conversation.matchId}`), {
      participantUids: conversation.participantUids,
      status: conversation.status,
      createdAt: now,
      lastMessageAt: now,
      lastMessageSenderUid: null,
      updatedAt: now,
    });
  }

  for (const report of reports) {
    batch.set(db.collection("reports").doc(`demo-report-${reports.indexOf(report) + 1}`), {
      reporterUid: report.reporterUid,
      targetUid: report.targetUid,
      targetMessageId: null,
      category: report.category,
      description: report.description,
      status: report.status,
      priority: report.priority,
      createdAt: now,
      resolvedAt: null,
    });
  }

  await batch.commit();

  // Messages are written after the batch so each gets a server timestamp.
  for (const [index, message] of messages.entries()) {
    await db
      .collection(`conversations/${message.matchId}/messages`)
      .doc(`demo-msg-${index + 1}`)
      .set({
        senderUid: message.senderUid,
        type: "text",
        body: message.body,
        moderationStatus: "unreviewed",
        createdAt: now,
        deletedAt: null,
      });
  }

  // Consent records for the active demo users.
  for (const user of users.slice(0, 3)) {
    await db.doc(`consentRecords/${user.uid}-terms`).set({
      uid: user.uid,
      type: "terms",
      version: "1.0",
      grantedAt: now,
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        project: EXPECTED_PROJECT,
        emulatorHost,
        seeded: {
          users: users.length,
          profiles: profiles.length,
          preferences: preferences.length,
          ageAssurance: ageDocs.length,
          blocks: blocks.length,
          matches: matches.length,
          conversations: conversations.length,
          messages: messages.length,
          reports: reports.length,
        },
      },
      null,
      2,
    ),
  );
}

seed()
  .catch((error) => {
    console.error(JSON.stringify({ status: "ERROR", name: error.name, message: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await deleteApp(app);
  });
