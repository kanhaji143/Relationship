/**
 * Domain model types for the Firestore documents created in the auth phase.
 *
 * Mirrors docs/FIRESTORE_SCHEMA.md. All timestamps are server-injected UTC
 * Firestore Timestamps; the structural type below is satisfied by both the
 * client and Admin SDK Timestamp classes without coupling this file to either.
 */

export type FirestoreTimestamp = {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
};

export type AccountStatus = "active" | "paused" | "suspended" | "pendingDeletion" | "deleted";

export type RelationshipIntent = "serious" | "casual";

export type Visibility = "visible" | "hidden";

export type ModerationStatus = "pending" | "approved" | "rejected" | "needsReview";

export type UserRole = "user" | "support" | "moderator" | "admin";

export type ConsentPurpose =
  "terms_of_service" | "privacy_policy" | "age_assurance" | "marketing" | "analytics";

export type ConsentChoice = "granted" | "denied";

/** `users/{uid}` — account state only. Credentials live in Firebase Auth. */
export type UserDoc = {
  uid: string;
  emailNormalized: string;
  accountStatus: AccountStatus;
  role: UserRole;
  emailVerifiedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  lastLoginAt: FirestoreTimestamp | null;
};

/**
 * `users/{uid}/private/{doc}` — minimal, purpose-bound data.
 * Never store raw ID documents here by default.
 */
export type PrivateUserDoc = {
  ageAssurance: {
    method: "self_declared" | "document" | "vendor";
    status: "unverified" | "verified" | "failed";
    verifiedAt: FirestoreTimestamp | null;
  };
  updatedAt: FirestoreTimestamp;
};

/** `profiles/{uid}` — public profile fields only, no contact/private data. */
export type ProfileDoc = {
  uid: string;
  displayName: string;
  birthDate: string | null; // ISO date (YYYY-MM-DD), or null when minimized
  pronouns: string | null;
  bio: string;
  countryCode: string; // ISO 3166-1 alpha-2
  regionCode: string | null;
  broadLocationLabel: string;
  languages: string[]; // BCP 47
  visibility: Visibility;
  moderationStatus: ModerationStatus;
  photoCount: number;
  interestIds: string[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

/** `preferences/{uid}` — intent is separate from discovery filters. */
export type PreferencesDoc = {
  uid: string;
  intent: RelationshipIntent;
  desiredIntents: RelationshipIntent[];
  ageMin: number;
  ageMax: number;
  distanceLimitKm: number | null;
  preferredRegions: string[];
  preferredLanguages: string[];
  dealbreakers: string[];
  discoveryPaused: boolean;
  updatedAt: FirestoreTimestamp;
};

/** `consentRecords/{recordId}` — append-style audit of granular consent. */
export type ConsentRecordDoc = {
  uid: string;
  purpose: ConsentPurpose;
  policyVersion: string;
  choice: ConsentChoice;
  locale: string;
  capturedAt: FirestoreTimestamp;
  withdrawnAt: FirestoreTimestamp | null;
};

/** `auditLogs/{logId}` — restricted access, minimal metadata. */
export type AuditLogDoc = {
  actorUid: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reasonCode: string | null;
  requestId: string | null;
  createdAt: FirestoreTimestamp;
};
