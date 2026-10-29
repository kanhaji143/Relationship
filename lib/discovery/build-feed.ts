import { areMutuallyEligible } from "@/lib/discovery/eligibility";
import type { DiscoveryParticipant } from "@/lib/discovery/participant";
import { compatibilityScore } from "@/lib/discovery/scoring";

export type CandidateSource = {
  participant: DiscoveryParticipant;
  displayName: string;
  bio: string;
  broadLocationLabel: string;
  promptKeys: readonly string[];
};

export type CandidateCard = {
  uid: string;
  displayName: string;
  bio: string;
  broadLocationLabel: string;
  languages: string[];
  interestIds: string[];
  intent: "serious" | "casual";
  age: number;
  score: number;
};

/** Apply reciprocal hard filters, rank eligible records, and return public card fields only. */
export function buildCandidateFeed(
  viewer: DiscoveryParticipant,
  candidates: readonly CandidateSource[],
  seenUids: ReadonlySet<string>,
  viewerPromptKeys: ReadonlySet<string>,
  now: number,
): CandidateCard[] {
  return candidates
    .filter(({ participant }) => {
      const candidateUid = participant.profile.uid;
      if (seenUids.has(candidateUid)) return false;
      return areMutuallyEligible(
        viewer.viewer,
        participant.profile,
        participant.viewer,
        viewer.profile,
      ).eligible;
    })
    .map(({ participant, displayName, bio, broadLocationLabel, promptKeys }) => {
      const sharedInterests = participant.profile.interestIds.filter((interest) =>
        viewer.profile.interestIds.includes(interest),
      ).length;
      const sharedLanguages = participant.profile.languages.filter((language) =>
        viewer.viewer.preferredLanguages.includes(language),
      ).length;
      const sharedPromptAnswers = new Set(promptKeys.filter((key) => viewerPromptKeys.has(key)))
        .size;
      const score = compatibilityScore({
        sharedInterests,
        totalInterests: Math.max(participant.profile.interestIds.length, 1),
        sharedLanguages,
        totalLanguages: Math.max(viewer.viewer.preferredLanguages.length, 1),
        sharedPromptAnswers,
        candidateAge: participant.profile.age,
        preferredAgeMidpoint: (viewer.viewer.ageMin + viewer.viewer.ageMax) / 2,
        candidateCreatedAt: participant.profile.createdAt,
        now,
      });

      return {
        uid: participant.profile.uid,
        displayName,
        bio,
        broadLocationLabel,
        languages: participant.profile.languages,
        interestIds: participant.profile.interestIds,
        intent: participant.profile.intent,
        age: participant.profile.age,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
}
