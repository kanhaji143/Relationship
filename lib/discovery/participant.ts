import type { CandidateProfile, ViewerContext } from "@/lib/discovery/eligibility";
import { ageFromBirthDate } from "@/lib/discovery/age";
import { MAX_AGE, MIN_AGE } from "@/lib/validation/auth";

type Intent = "serious" | "casual";
type AccountStatus = "active" | "paused" | "suspended" | "pendingDeletion" | "deleted";
type ProfileVisibility = "visible" | "hidden";
type ModerationStatus = "pending" | "approved" | "rejected" | "needsReview";

export type ParticipantData = {
  uid: string;
  user: Record<string, unknown>;
  profile: Record<string, unknown>;
  preferences: Record<string, unknown>;
  privateAge: Record<string, unknown>;
  blockedUids: readonly string[];
};

export type DiscoveryParticipant = {
  viewer: ViewerContext;
  profile: CandidateProfile;
};

function isOneOf<const T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function timestampMillis(value: unknown): number {
  if (
    value !== null &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return 0;
}

/** Normalize the server-owned Firestore records needed to check a pair. */
export function toDiscoveryParticipant(data: ParticipantData): DiscoveryParticipant | null {
  const accountStatus = data.user.accountStatus;
  const intent = data.preferences.intent;
  const age = ageFromBirthDate(data.privateAge.birthDate);

  if (!isOneOf(accountStatus, ["active", "paused", "suspended", "pendingDeletion", "deleted"])) {
    return null;
  }
  if (!isOneOf(intent, ["serious", "casual"]) || age === null || age < MIN_AGE || age > MAX_AGE) {
    return null;
  }

  const visibility: ProfileVisibility = isOneOf(data.profile.visibility, ["visible", "hidden"])
    ? data.profile.visibility
    : "hidden";
  const moderationStatus: ModerationStatus = isOneOf(data.profile.moderationStatus, [
    "pending",
    "approved",
    "rejected",
    "needsReview",
  ])
    ? data.profile.moderationStatus
    : "pending";
  const desiredIntents = stringArray(data.preferences.desiredIntents).filter(
    (value): value is Intent => value === "serious" || value === "casual",
  );
  const ageMin = typeof data.preferences.ageMin === "number" ? data.preferences.ageMin : 18;
  const ageMax = typeof data.preferences.ageMax === "number" ? data.preferences.ageMax : 99;
  const regionCode = typeof data.profile.regionCode === "string" ? data.profile.regionCode : null;
  const languages = stringArray(data.profile.languages);
  const interestIds = stringArray(data.profile.interestIds);

  const profile: CandidateProfile = {
    uid: data.uid,
    accountStatus: accountStatus as AccountStatus,
    age,
    intent,
    countryCode: typeof data.profile.countryCode === "string" ? data.profile.countryCode : "IN",
    regionCode,
    languages,
    interestIds,
    visibility,
    moderationStatus,
    discoveryPaused: data.preferences.discoveryPaused === true,
    createdAt: timestampMillis(data.profile.createdAt),
  };

  const viewer: ViewerContext = {
    uid: data.uid,
    accountStatus: accountStatus as AccountStatus,
    intent,
    desiredIntents: desiredIntents.length > 0 ? desiredIntents : [intent],
    ageMin: Number.isInteger(ageMin) && ageMin >= 18 && ageMin <= 99 ? ageMin : 18,
    ageMax: Number.isInteger(ageMax) && ageMax >= ageMin && ageMax <= 99 ? ageMax : 99,
    preferredRegions: stringArray(data.preferences.preferredRegions),
    preferredLanguages: stringArray(data.preferences.preferredLanguages),
    blockedUids: data.blockedUids,
    pausedDiscovery: data.preferences.discoveryPaused === true,
  };

  return { viewer, profile };
}
