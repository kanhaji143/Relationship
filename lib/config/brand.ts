/**
 * Brand configuration.
 *
 * Branding is configurable via environment variables until the provisional
 * name/domain/trademark are cleared (docs/DECISIONS.md #6). This module is
 * safe to import from client and server components: every value comes from a
 * literal `process.env.NEXT_PUBLIC_*` reference, which Next.js inlines at
 * build time.
 */

const PROVISIONAL_BRAND = "Bondora";

const name = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || PROVISIONAL_BRAND;
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const brand = Object.freeze({
  name,
  provisional: name === PROVISIONAL_BRAND,
  tagline: "Privacy-first relationships, built on consent.",
  description:
    "An adults-only relationship platform with explicit intent, privacy by default, and safety features available to everyone.",
  appUrl,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "",
  grievanceOfficer: {
    name: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME?.trim() || "",
    contact: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_CONTACT?.trim() || "",
  },
  minAge: 18,
} as const);

export type Brand = typeof brand;
