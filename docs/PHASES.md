# Phase Tracker (Firebase edition)

Source: docs/PRODUCT_BLUEPRINT.md §12/§14 — adapted per docs/DECISIONS.md.

Current status: **Phase 2 complete — discovery and mutual-match flows verified on the local emulator and on live `apna-computer-ltd`. Live test accounts and fixtures were deleted; two append-only audit events remain. Phase 3 is next. Phase 1 photo storage remains blocked on bucket/privacy approval.**
Rule: each phase keeps the app runnable before the next begins.

| Phase                                   | Scope                                                                                                                                                                                                                                                                                                      | Exit criteria                                                                                                       | Status                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **0 — Discovery & setup**               | Repo skeleton ✅ • docs ✅ • rules drafted and deployed ✅ • Next.js 16 scaffold + brand config ✅ • env wiring + validation ✅ • auth-phase types/schemas ✅ • quality tooling ✅ • Firebase setup guide ✅                                                                                               | App boots locally with brand config ✅ • rules deploy cleanly ✅ • links to blueprints live ✅                      | ✅ Done                   |
| **1 — Foundations**                     | Responsive shell + UI kit ✅ • Firebase Auth + HttpOnly sessions ✅ • onboarding + server-side 18+ gate ✅ • exact DOB private-only ✅ • moderated prompts + discovery preferences ✅ • private photo upload pipeline ⏳ (Storage privacy/signing config needs owner action) • shared-store rate limits ⏳ | signup→login→onboarding E2E ✅; underage blocked ✅; prompts/preferences E2E ✅; photo pipeline awaits owner action | 🟡 In progress (1A–1C)    |
| **2 — Discovery & matching**            | Candidate pool computation • /discover (like/pass, intent badges, filters, empty state) • /likes • /matches • block-aware exclusions • self/dupe-like prevention                                                                                                                                           | No blocked pair ever recommended; match tests pass                                                                  | ✅ Done (emulator + live) |
| **3 — Chat & safety**                   | Realtime conversations (participants only) • messages + moderation hooks • report/block/unmatch • /admin console: queue, triage, appeals, audit logs, role-based staff access (MFA)                                                                                                                        | Participant-only access enforced; report lifecycle tested; audit trails verified                                    | —                         |
| **4 — Privacy & billing**               | Privacy center: pause/hide, visibility, notification privacy, export/delete workflows • plans page (transparent terms) • Razorpay adapter (test mode): checkout, webhook signature verify, idempotency, cancellation                                                                                       | Export/deletion tested; billing test-mode only; plan terms visible pre-checkout                                     | —                         |
| **5 — Launch readiness (private beta)** | Monitoring/observability • accessibility review • e2e suite • threat model update • docs/LEGAL_CHECKLIST_INDIA.md sign-off • moderation staffing plan • incident drill                                                                                                                                     | Blueprint §13 MVP acceptance checklist green; counsel sign-off; launch gate PASSED                                  | —                         |

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

## Firebase live verification (2026-10-28)

| Criterion                            | Evidence                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Real signup → registration → session | Browser run: registration 201, session exchange 200, protected `/account` rendered (`evidence/run-2026-10-28-firebase-live/15-browser-e2e.json`) |
| Logout → login                       | DELETE session 200; login session exchange 200; protected account rendered                                                                       |
| Onboarding + server age gate         | Valid save 200; authenticated underage API attempt 403 `underage`; no invalid overwrite                                                          |
| Firestore records + DOB privacy      | Admin verifier PASS: account/profile/preferences/consents/audit; public DOB null; exact DOB in private doc (`15.log`)                            |
| Rules deploy                         | Firestore + Storage rules deployed (`16-rules-deploy.log`)                                                                                       |
| Quality + evidence                   | 15/15 automated checks plus 7/7 browser E2E checks; 84 unit tests; production build 12 routes                                                    |
| Still blocked                        | Emulator suite (TC-022; JDK 21+) and, as of Phase 1C, photo storage readiness (TC-045)                                                           |

## Phase 1C live verification (2026-10-28)

| Criterion                  | Evidence                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile prompts            | Two approved answers saved, reloaded and verified in Firestore; schema rejects contact details                                              |
| Discovery preferences      | Age/intents/region/language saved and reloaded; own relationship intent remained separate                                                   |
| Authorization + validation | Settings pages protected; APIs reject missing session/Origin and malformed prompt/filter payloads                                           |
| Quality + evidence         | 16/16 automated checks; 95 unit tests; 16 production routes; 9 executable browser checks pass                                               |
| Storage prerequisite       | Bucket exists in `ASIA-SOUTH1`, but uniform access/signing are not ready; no permissions or billing changed (`16-storage-prerequisite.log`) |

## Phase 2 discovery & matching exit evidence (2026-10-29)

| Criterion                       | Evidence                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate eligibility + ranking | Server-side account/age/intent/preferences/block filters; ranking weights and reciprocal eligibility are unit-tested                    |
| Discovery experience            | Protected `/discover` shows candidate cards, intent and ranking labels, loading/empty/error states, and Like/Pass                       |
| Likes + matches                 | Protected pages read account-scoped records; like/pass and mutual match/conversation writes use a Firestore transaction                 |
| Route/security checks           | `/discover`, `/likes`, `/matches` redirect unauthenticated users; candidate GET and like POST reject missing sessions/origin            |
| Quality + evidence              | `evidence/run-2026-10-29-phase2-complete/`: 15/15 checks, 142 unit tests, production build and route smoke pass                         |
| Emulator integration            | `evidence/run-2026-10-29-phase2-emulator/`: JDK 21; `demo-bondora` Auth/Firestore/Storage; 3/3 route integration tests pass             |
| Live project status             | `evidence/run-2026-10-29-phase2-live/`: guarded run passed; 2 synthetic users + all fixtures deleted, 2 append-only audit rows retained |
