/**
 * Onboarding allow-lists.
 *
 * India-first MVP: country is fixed to IN until counsel clears other markets.
 * Regions are deliberately broad (no city or precise location).
 */

export const ONBOARDING_COUNTRY = "IN" as const;

export const REGIONS = [
  { id: "north", label: "North India" },
  { id: "south", label: "South India" },
  { id: "east", label: "East India" },
  { id: "west", label: "West India" },
  { id: "central", label: "Central India" },
  { id: "northeast", label: "Northeast India" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export const REGION_IDS = REGIONS.map((region) => region.id);

export const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((language) => language.code);

export const INTERESTS = [
  { id: "music", label: "Music" },
  { id: "films", label: "Films & series" },
  { id: "books", label: "Books" },
  { id: "travel", label: "Travel" },
  { id: "food", label: "Food & cooking" },
  { id: "fitness", label: "Fitness & sport" },
  { id: "art", label: "Art & design" },
  { id: "gaming", label: "Gaming" },
  { id: "nature", label: "Nature & outdoors" },
  { id: "tech", label: "Technology" },
  { id: "volunteering", label: "Volunteering" },
  { id: "pets", label: "Pets & animals" },
] as const;

export const INTEREST_IDS = INTERESTS.map((interest) => interest.id);

export function regionLabel(region: RegionId | null): string {
  if (!region) return "India";
  return REGIONS.find((entry) => entry.id === region)?.label ?? "India";
}
