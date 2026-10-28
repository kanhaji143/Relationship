import type { RegionId } from "@/lib/config/onboarding";

/** Owner-only values hydrated by the server for editing an existing profile. */
export type OnboardingDraft = {
  displayName: string;
  birthDate: string;
  intent: "serious" | "casual";
  region: RegionId | null;
  languages: string[];
  bio: string;
  interestIds: string[];
};
