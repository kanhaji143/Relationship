/**
 * Firestore collection paths (single source of truth for names).
 *
 * These mirror docs/FIRESTORE_SCHEMA.md. Client code must never use them to
 * query Firestore directly — reads/writes go through server routes or Cloud
 * Functions (docs/DECISIONS.md #3).
 */

export const COLLECTIONS = {
  users: "users",
  profiles: "profiles",
  profilePhotos: "profilePhotos",
  preferences: "preferences",
  interests: "interests",
  prompts: "prompts",
  likes: "likes",
  matches: "matches",
  conversations: "conversations",
  blocks: "blocks",
  reports: "reports",
  moderationActions: "moderationActions",
  consentRecords: "consentRecords",
  verificationRecords: "verificationRecords",
  subscriptions: "subscriptions",
  plans: "plans",
  paymentEvents: "paymentEvents",
  privacyRequests: "privacyRequests",
  auditLogs: "auditLogs",
  supportCases: "supportCases",
  discoveryPool: "discoveryPool",
  userBlocksIndex: "userBlocksIndex",
  emailLookup: "emailLookup",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const userDoc = (uid: string) => `${COLLECTIONS.users}/${uid}` as const;
export const userPrivateDoc = (uid: string, docId: string) =>
  `${COLLECTIONS.users}/${uid}/private/${docId}` as const;
export const profileDoc = (uid: string) => `${COLLECTIONS.profiles}/${uid}` as const;
export const preferencesDoc = (uid: string) => `${COLLECTIONS.preferences}/${uid}` as const;
export const conversationDoc = (matchId: string) =>
  `${COLLECTIONS.conversations}/${matchId}` as const;
export const messageDoc = (matchId: string, messageId: string) =>
  `${COLLECTIONS.conversations}/${matchId}/messages/${messageId}` as const;

/** Canonical match document id, so a pair can only ever have one match. */
export function canonicalMatchId(uidA: string, uidB: string): string {
  const [a, b] = [uidA, uidB].sort();
  return `${a}_${b}`;
}
