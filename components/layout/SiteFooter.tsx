import { brand } from "@/lib/config/brand";

/**
 * Site footer. Legal pages are Phase 1+; until they exist the links stay
 * disabled rather than pointing at dead routes.
 */

export function SiteFooter() {
  return (
    <footer className="border-line/80 bg-canvas border-t">
      <div className="text-ink-muted mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 text-sm sm:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-ink font-medium">{brand.name}</p>
          <p>{brand.description}</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span>
            Terms <span className="text-xs">(coming soon)</span>
          </span>
          <span>
            Privacy <span className="text-xs">(coming soon)</span>
          </span>
          <span>
            Safety <span className="text-xs">(coming soon)</span>
          </span>
          {brand.supportEmail ? (
            <a
              className="hover:text-ink underline decoration-dotted underline-offset-4"
              href={`mailto:${brand.supportEmail}`}
            >
              Support
            </a>
          ) : (
            <span>Support email not configured</span>
          )}
        </div>

        <div className="border-line/60 flex flex-col gap-1 border-t pt-4 text-xs">
          <p>
            Adults only ({brand.minAge}+). Safety tools are never paywalled. No fake engagement, no
            dark patterns, no precise-location tracking.
          </p>
          <p>
            {brand.provisional
              ? "Working brand name — pending trademark/domain clearance. Not a public launch."
              : "Private beta."}
          </p>
          <p>
            Grievance Officer:{" "}
            {brand.grievanceOfficer.name && brand.grievanceOfficer.contact
              ? `${brand.grievanceOfficer.name} — ${brand.grievanceOfficer.contact}`
              : "to be appointed before launch (India IT Rules requirement)"}
          </p>
        </div>
      </div>
    </footer>
  );
}
