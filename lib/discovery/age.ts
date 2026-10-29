import { parseIsoDate } from "@/lib/validation/auth";

/** Returns a whole-number age for a valid ISO birth date, or null if invalid. */
export function ageFromBirthDate(birthDate: unknown, now: Date = new Date()): number | null {
  if (typeof birthDate !== "string") return null;

  const parsed = parseIsoDate(birthDate);
  if (!parsed) return null;

  const year = now.getUTCFullYear() - parsed.getUTCFullYear();
  const hadBirthday =
    now.getUTCMonth() > parsed.getUTCMonth() ||
    (now.getUTCMonth() === parsed.getUTCMonth() && now.getUTCDate() >= parsed.getUTCDate());

  return year - (hadBirthday ? 0 : 1);
}
