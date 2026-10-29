/**
 * Discovery eligibility — pure, server-side hard filters.
 *
 * The browser never participates in eligibility. These filters run after account
 * status, age, block and intent compatibility checks.
 */

export type CandidateProfile = {
  uid: string;
  accountStatus: "active" | "paused" | "suspended" | "pendingDeletion" | "deleted";
  age: number;
  intent: "serious" | "casual";
  countryCode: string;
  regionCode: string | null;
  languages: string[];
  interestIds: string[];
  visibility: "visible" | "hidden";
  moderationStatus: "pending" | "approved" | "rejected" | "needsReview";
  discoveryPaused: boolean;
  createdAt: number; // epoch ms
};

export type ViewerContext = {
  uid: string;
  accountStatus: "active" | "paused" | "suspended" | "pendingDeletion" | "deleted";
  intent: "serious" | "casual";
  desiredIntents: ("serious" | "casual")[];
  ageMin: number;
  ageMax: number;
  preferredRegions: string[];
  preferredLanguages: string[];
  blockedUids: readonly string[];
  pausedDiscovery: boolean;
};

export type EligibilityResult = { eligible: boolean; reason?: string };

/**
 * Returns whether a candidate may appear in the viewer's discovery feed.
 * Reasons are machine codes, never shown to the user.
 */
export function isEligible(viewer: ViewerContext, candidate: CandidateProfile): EligibilityResult {
  if (candidate.uid === viewer.uid) return { eligible: false, reason: "self" };
  if (viewer.blockedUids.includes(candidate.uid)) return { eligible: false, reason: "blocked" };
  if (candidate.accountStatus !== "active") return { eligible: false, reason: "inactive_account" };
  if (viewer.accountStatus !== "active") return { eligible: false, reason: "viewer_inactive" };
  if (candidate.visibility !== "visible") return { eligible: false, reason: "hidden" };
  if (candidate.moderationStatus !== "approved") return { eligible: false, reason: "not_approved" };
  if (candidate.discoveryPaused) return { eligible: false, reason: "candidate_paused" };
  if (viewer.pausedDiscovery) return { eligible: false, reason: "viewer_paused" };

  if (!viewer.desiredIntents.includes(candidate.intent)) {
    return { eligible: false, reason: "intent_mismatch" };
  }

  if (candidate.age < viewer.ageMin || candidate.age > viewer.ageMax) {
    return { eligible: false, reason: "age_out_of_range" };
  }

  if (viewer.preferredRegions.length > 0) {
    if (candidate.regionCode === null || !viewer.preferredRegions.includes(candidate.regionCode)) {
      return { eligible: false, reason: "region_mismatch" };
    }
  }

  if (viewer.preferredLanguages.length > 0) {
    const shared = candidate.languages.some((lang) => viewer.preferredLanguages.includes(lang));
    if (!shared) return { eligible: false, reason: "language_mismatch" };
  }

  return { eligible: true };
}

/** Both people must independently accept the other's profile and preferences. */
export function areMutuallyEligible(
  viewer: ViewerContext,
  candidate: CandidateProfile,
  candidateViewer: ViewerContext,
  viewerProfile: CandidateProfile,
): EligibilityResult {
  const viewerAllowsCandidate = isEligible(viewer, candidate);
  if (!viewerAllowsCandidate.eligible) return viewerAllowsCandidate;

  return isEligible(candidateViewer, viewerProfile);
}

export function filterEligible(
  viewer: ViewerContext,
  candidates: readonly CandidateProfile[],
): CandidateProfile[] {
  return candidates.filter((candidate) => isEligible(viewer, candidate).eligible);
}
