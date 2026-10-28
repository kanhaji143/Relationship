# Phase Tracker (Firebase edition)

Source: docs/PRODUCT_BLUEPRINT.md §12/§14 — adapted per docs/DECISIONS.md.

Current status: **Phase 1 in progress — slices 1A (auth entry + sessions) and 1B (onboarding basics) complete; photos/prompts/discovery filters next.**
Rule: each phase keeps the app runnable before the next begins.

| Phase                                   | Scope                                                                                                                                                                                                                                                                                                                                                                                             | Exit criteria                                                                                                     | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **0 — Discovery & setup**               | Repo skeleton ✅ • docs (blueprint, architecture, schema, legal checklist, decisions) ✅ • rules drafts ✅ • Next.js 16 scaffold + brand config ✅ • env wiring + validation ✅ • auth-phase types/schemas ✅ • lint/format/typecheck/test tooling ✅ • Firebase walkthrough doc ✅ • **human action pending: create Firebase project + deploy rules**                                            | App boots locally with brand config ✅ • rules deploy cleanly (awaiting project) 🟡 • links to blueprints live ✅ | ✅ Done 2026-10-27     |
| **1 — Foundations**                     | Responsive shell + UI kit ✅ • Next.js + Firebase Auth integration with HttpOnly cookie sessions 🟡 (1A built, E2E blocked) • onboarding (display name, birth date/age gate, broad region, languages, intent, interests) 🟡 (1B built, E2E blocked) • photo upload pipeline + prompts ⏳ • profiles/preferences writes 🟡 (via server routes) • validation, rate limits, audit for auth events ✅ | signup→login→onboarding end-to-end; underage blocked; authorization + auth tests pass                             | 🟡 In progress (1A+1B) |
| **2 — Discovery & matching**            | Candidate pool computation • /discover (like/pass, intent badges, filters, empty state) • /likes • /matches • block-aware exclusions • self/dupe-like prevention                                                                                                                                                                                                                                  | No blocked pair ever recommended; match tests pass                                                                | —                      |
| **3 — Chat & safety**                   | Realtime conversations (participants only) • messages + moderation hooks • report/block/unmatch • /admin console: queue, triage, appeals, audit logs, role-based staff access (MFA)                                                                                                                                                                                                               | Participant-only access enforced; report lifecycle tested; audit trails verified                                  | —                      |
| **4 — Privacy & billing**               | Privacy center: pause/hide, visibility, notification privacy, export/delete workflows • plans page (transparent terms) • Razorpay adapter (test mode): checkout, webhook signature verify, idempotency, cancellation                                                                                                                                                                              | Export/deletion tested; billing test-mode only; plan terms visible pre-checkout                                   | —                      |
| **5 — Launch readiness (private beta)** | Monitoring/observability • accessibility review • e2e suite • threat model update • docs/LEGAL_CHECKLIST_INDIA.md sign-off • moderation staffing plan • incident drill                                                                                                                                                                                                                            | Blueprint §13 MVP acceptance checklist green; counsel sign-off; launch gate PASSED                                | —                      |

## Standing constraints (from blueprint §MASTER rules)

- Phased, runnable after each phase.
- Lint, typecheck, tests, build run before "done" claims; results reported honestly.
- No fake integrations — adapters + safe test modes (billing/email/photo-moderation now).
- Seed data fictional only.
- Blueprint-excluded features (dark patterns, fake engagement, paid safety access, precise-location tracking) explicitly EXCLUDED.

## Phase 0 exit evidence (2026-10-27)

| Criterion                           | Evidence                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| App boots locally with brand config | `npm run build` → 4 static routes; `npm run dev` serves `/`, `/how-it-works`, `/safety`; brand name comes from `NEXT_PUBLIC_BRAND_NAME` |
| Rules deploy cleanly                | Drafts finalized + wired in `firebase.json`; deployment needs a real project (`docs/SETUP_FIREBASE.md`) — not yet run                   |
| Links to blueprints live            | `README.md` links every doc; app footer/landing link to public pages                                                                    |
| Tooling                             | `npm run verify` — format, lint, typecheck, 32 tests, build all green                                                                   |
| Delivery workflow                   | `RFP.md` → `TestCases.md` → `npm run evidence` → `evidence/phase0-2026-10-27/` (12/12 checks pass, 2 blocked on human actions)          |

## Phase 1A exit evidence (2026-10-28)

| Criterion                         | Evidence                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth entry pages render           | `/login`, `/signup`, `/forgot-password` → 200 with headings/forms (`evidence/run-2026-10-28-phase1a-r2/06-route-smoke.json`)               |
| HttpOnly session + CSRF + limits  | Cookie tests, origin tests, limiter tests; unauthenticated `/account` → 307 `/login`; auth APIs reject missing Origin with 403             |
| Registration is server-authorized | `POST /api/auth/register` verifies ID token, validates consents, writes user/consents/lookup/audit in one transaction (statically checked) |
| Quality gates                     | 13/13 evidence checks pass; 72 unit tests; 10 routes in production build                                                                   |
| Not yet verified (honest)         | Real signup→login→session loop (TC-032), registration transaction execution (TC-028), rules deploy (TC-021), emulators (TC-022)            |

## Phase 1B exit evidence (2026-10-28)

| Criterion                    | Evidence                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding page + protection | `/onboarding` → 307 `/login` unauthenticated; page requires session behind Suspense (`evidence/run-2026-10-28-phase1b/06-route-smoke.json`) |
| Server-side 18+ gate         | Under-18 birth dates rejected in the shared schema; the route maps that to `403 underage` (`lib/validation/onboarding.test.ts`)             |
| Privacy-safe allow-lists     | Country fixed to IN; broad regions only; languages/interests allow-listed; bio sanitized (static check `14.log`)                            |
| Atomic save designed         | Session-derived uid + transaction across profile/preferences/age declaration/audit (`14.log`) — execution blocked (TC-037)                  |
| Quality gates                | 14/14 evidence checks pass; 84 unit tests; 12 routes in production build                                                                    |
| Not yet verified (honest)    | Onboarding save + account render E2E (TC-037–039), rules deploy (TC-021), emulators (TC-022)                                                |
