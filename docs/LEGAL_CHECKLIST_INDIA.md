# India Legal Checklist — launch gate anchors

> **Not legal advice.** This checklist is derived from the product blueprint's section 9/16 and must be reviewed with qualified counsel for the actual product flows before launch. Owners marked 👤 = human action (company/client), ⚙️ = implemented in product, 📄 = documented for counsel review.

## 1. Data protection — DPDP Act 2023 + DPDP Rules (transition: verify current commencement schedule at launch)

- ⚙️ Privacy notice in plain language: data collected, purposes, retention, rights, grievance contacts.
- ⚙️ Granular consent records (purpose, policy version, locale, timestamp, withdrawal) — `consentRecords` collection.
- ⚙️ Data minimization: no precise GPS, no contact-list access, no sensitive inference in ranking; minimized age-assurance result only.
- ⚙️ Data rights workflow: export request, deletion request with status tracking and documented retention exceptions (`privacyRequests`).
- ⚙️ Breach/incident response plan documented; notification process ready.
- ⚙️ Cross-border transfer disclosure (Firebase regions; asia-south1 preferred) in privacy notice. 👤 Vendor/processor inventory for counsel.
- ⚙️ Children/minors: adult-only service; age gate at onboarding; no marketing to minors; minors blocked from onboarding.
- 👤 Appoint Data Protection Officer / contact as applicable after counsel determines classification.

## 2. Intermediary rules — IT Act §79 / IT Rules 2021 (verify current amendments at launch)

- 👤 **India-based Grievance Officer** — name, designation, contact published in-app and on website (mandatory).
- ⚙️ Complaint handling: report categories with priority (NCII/threats/impersonation/minors = top), intake → triage → resolve → audit; ✅ target timelines per counsel.
- ⚙️ Moderation mechanics: moderation queue, action history, user appeal path, repeat-offender controls.
- 📄 Takedown/retention records; impaired-content evidence handling documented for law-enforcement requests (process via counsel only).
- 👤 Compliance report cadence as applicable to classification (verify with counsel whether thresholds met).

## 3. Adults-only / age assurance

- ⚙️ 18+ age gate with birth-date entry at onboarding; underage → blocked + deletion of any partial data.
- 📄 Proportionate age-assurance design memo (no raw ID storage by default) for counsel sign-off.
- ⚙️ Safety features free for all users — never paywalled (report/block/safety center/deletion).

## 4. Payments & subscriptions (Razorpay recommended for India)

- 👤 Company registration + GST registration before charging real money.
- ⚙️ Checkout shows: total price, currency, billing interval, auto-renewal terms, cancellation steps, refund/contact terms — before purchase.
- ⚙️ Webhook signature verification + idempotent event processing (`paymentEvents` id = provider event id).
- ⚙️ **Payments remain in test mode until credentials + legal review are complete.**
- ⚙️ Razorpay keeps payment data out of our systems (minimal `paymentEvents` payload references only).
- 👤 Consumer-protection / auto-renewal / cancellation rule check (current rules) with counsel.

## 5. Brand & trademark

- 👤 Trademark search + registration for final brand name (working name "Bondora" is PROVISIONAL ONLY).
- 👤 Domain + company name + app-store name checks before public launch.
- ⚙️ Branding configurable via env (`NEXT_PUBLIC_BRAND_NAME`) until clearance.

## 6. Content & safety policy

- ⚙️ Community guidelines, safety center (/safety), emergency guidance; NCIHI/NCII handling workflow.
- ⚙️ Block/unmatch immediately restrict contact in both directions.
- 📄 Evidence handling procedure for urgent safety escalations.
- 👤 Moderation staffing plan (who reviews reports, response-time targets) — operational requirement.

## 7. Accessibility & transparency

- ⚙️ Keyboard navigation, visible focus, contrast, alt text, semantic forms, mobile layouts.
- ⚙️ Honest encryption disclosure: no false E2EE claims (TLS + restricted staff access).

## Launch gate (blueprint §9)

No launch until: counsel sign-off on items 1–4 for India, grievance officer live, moderation staffing ready, retention schedule documented, and the MVP acceptance checklist (blueprint §13) fully green. Do not enable any other country without separate counsel review.
