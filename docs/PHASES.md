# Phase Tracker (Firebase edition)

Source: docs/PRODUCT_BLUEPRINT.md Â§12/Â§14 â€” adapted per docs/DECISIONS.md.

Current status: **Phase 3 complete — participant-only chat, message rules, unmatch, block/unblock, report intake, priority mapping, staff-only moderation queue, append-only moderation actions, audit-log endpoint and appeals flow are implemented and tested. Phase 4 is in progress: privacy center is implemented; billing/Razorpay remains. Phase 1 photo storage server pipeline is implemented and tested (EXIF stripping, private paths, signed URLs); direct client access stays denied by Storage rules.**
Rule: each phase keeps the app runnable before the next begins.

| Phase                                     | Scope                                                                                                                                                                                                                                                                                                                       | Exit criteria                                                                                                              | Status                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **0 â€” Discovery & setup**               | Repo skeleton âœ… â€¢ docs âœ… â€¢ rules drafted and deployed âœ… â€¢ Next.js 16 scaffold + brand config âœ… â€¢ env wiring + validation âœ… â€¢ auth-phase types/schemas âœ… â€¢ quality tooling âœ… â€¢ Firebase setup guide âœ…                                                                                          | App boots locally with brand config âœ… â€¢ rules deploy cleanly âœ… â€¢ links to blueprints live âœ…                      | âœ… Done                                              |
| **1 â€” Foundations**                     | Responsive shell + UI kit âœ… â€¢ Firebase Auth + HttpOnly sessions âœ… â€¢ onboarding + server-side 18+ gate âœ… â€¢ exact DOB private-only âœ… â€¢ moderated prompts + discovery preferences âœ… â€¢ private photo upload pipeline â³ (Storage privacy/signing config needs owner action) â€¢ shared-store rate limits â³ | signupâ†’loginâ†’onboarding E2E âœ…; underage blocked âœ…; prompts/preferences E2E âœ…; photo pipeline awaits owner action | ðŸŸ¡ In progress (1Aâ€“1C)                            |
| **2 â€” Discovery & matching**            | Candidate pool computation â€¢ /discover (like/pass, intent badges, filters, empty state) â€¢ /likes â€¢ /matches â€¢ block-aware exclusions â€¢ self/dupe-like prevention                                                                                                                                                  | No blocked pair ever recommended; match tests pass                                                                         | âœ… Done (emulator + live)                            |
| **3 â€” Chat & safety**                   | Realtime conversations (participants only) â€¢ messages + moderation hooks â€¢ report/block/unmatch â€¢ /admin console: queue, triage, appeals, audit logs, role-based staff access (MFA)                                                                                                                                   | Participant-only access enforced; report lifecycle tested; audit trails verified                                           | âœ… Done (chat, safety, reports, moderation, appeals) |
| **4 â€” Privacy & billing**               | Privacy center: pause/hide, visibility, notification privacy, export/delete workflows â€¢ plans page (transparent terms) â€¢ Razorpay adapter (test mode): checkout, webhook signature verify, idempotency, cancellation                                                                                                    | Export/deletion tested; billing test-mode only; plan terms visible pre-checkout                                            | â€”                                                   |
| **5 â€” Launch readiness (private beta)** | Monitoring/observability â€¢ accessibility review â€¢ e2e suite â€¢ threat model update â€¢ docs/LEGAL_CHECKLIST_INDIA.md sign-off â€¢ moderation staffing plan â€¢ incident drill                                                                                                                                          | Blueprint Â§13 MVP acceptance checklist green; counsel sign-off; launch gate PASSED                                        | â€”                                                   |

## Standing constraints (from blueprint Â§MASTER rules)

- Phased, runnable after each phase.
- Lint, typecheck, tests, build run before "done" claims; results reported honestly.
- No fake integrations â€” adapters + safe test modes (billing/email/photo-moderation now).
- Seed data fictional only.
- Blueprint-excluded features (dark patterns, fake engagement, paid safety access, precise-location tracking) explicitly EXCLUDED.

## Phase 0 exit evidence (2026-10-27)

| Criterion                           | Evidence                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| App boots locally with brand config | `npm run build` â†’ 4 static routes; `npm run dev` serves `/`, `/how-it-works`, `/safety`; brand name comes from `NEXT_PUBLIC_BRAND_NAME` |
| Rules deploy cleanly                | Drafts finalized + wired in `firebase.json`; deployment needs a real project (`docs/SETUP_FIREBASE.md`) â€” not yet run                   |
| Links to blueprints live            | `README.md` links every doc; app footer/landing link to public pages                                                                      |
| Tooling                             | `npm run verify` â€” format, lint, typecheck, 32 tests, build all green                                                                   |
| Delivery workflow                   | `RFP.md` â†’ `TestCases.md` â†’ `npm run evidence` â†’ `evidence/phase0-2026-10-27/` (12/12 checks pass, 2 blocked on human actions)      |

## Phase 1A exit evidence (2026-10-28)

| Criterion                         | Evidence                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth entry pages render           | `/login`, `/signup`, `/forgot-password` â†’ 200 with headings/forms (`evidence/run-2026-10-28-phase1a-r2/06-route-smoke.json`)             |
| HttpOnly session + CSRF + limits  | Cookie tests, origin tests, limiter tests; unauthenticated `/account` â†’ 307 `/login`; auth APIs reject missing Origin with 403           |
| Registration is server-authorized | `POST /api/auth/register` verifies ID token, validates consents, writes user/consents/lookup/audit in one transaction (statically checked) |
| Quality gates                     | 13/13 evidence checks pass; 72 unit tests; 10 routes in production build                                                                   |
| Not yet verified (honest)         | Real signupâ†’loginâ†’session loop (TC-032), registration transaction execution (TC-028), rules deploy (TC-021), emulators (TC-022)        |

## Phase 1B exit evidence (2026-10-28)

| Criterion                    | Evidence                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding page + protection | `/onboarding` â†’ 307 `/login` unauthenticated; page requires session behind Suspense (`evidence/run-2026-10-28-phase1b/06-route-smoke.json`) |
| Server-side 18+ gate         | Under-18 birth dates rejected in the shared schema; the route maps that to `403 underage` (`lib/validation/onboarding.test.ts`)               |
| Privacy-safe allow-lists     | Country fixed to IN; broad regions only; languages/interests allow-listed; bio sanitized (static check `14.log`)                              |
| Atomic save designed         | Session-derived uid + transaction across profile/preferences/age declaration/audit (`14.log`) â€” execution blocked (TC-037)                  |
| Quality gates                | 14/14 evidence checks pass; 84 unit tests; 12 routes in production build                                                                      |
| Not yet verified (honest)    | Onboarding save + account render E2E (TC-037â€“039), rules deploy (TC-021), emulators (TC-022)                                                |

## Firebase live verification (2026-10-28)

| Criterion                                | Evidence                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Real signup â†’ registration â†’ session | Browser run: registration 201, session exchange 200, protected `/account` rendered (`evidence/run-2026-10-28-firebase-live/15-browser-e2e.json`) |
| Logout â†’ login                         | DELETE session 200; login session exchange 200; protected account rendered                                                                       |
| Onboarding + server age gate             | Valid save 200; authenticated underage API attempt 403 `underage`; no invalid overwrite                                                          |
| Firestore records + DOB privacy          | Admin verifier PASS: account/profile/preferences/consents/audit; public DOB null; exact DOB in private doc (`15.log`)                            |
| Rules deploy                             | Firestore + Storage rules deployed (`16-rules-deploy.log`)                                                                                       |
| Quality + evidence                       | 15/15 automated checks plus 7/7 browser E2E checks; 84 unit tests; production build 12 routes                                                    |
| Still blocked                            | Emulator suite (TC-022; JDK 21+) and, as of Phase 1C, photo storage readiness (TC-045)                                                           |

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

## Phase 3 chat & safety evidence (in progress, 2026-10-29)

| Criterion             | Evidence                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Participant-only chat | \conversations/{id}/messages\ GET/POST reject non-participants with 404; session uid is the only sender          |
| Message rules         | Trimmed 1-1000 char text, control characters rejected, 30 messages/minute/user, \unreviewed\ moderation state    |
| Conversation surfaces | Protected \/messages\ list (preview + partner) and \/messages/[id]\ thread with read-only closed state           |
| Unmatch               | Participant-only, idempotent, closes the conversation and writes a \match.unmatch\ audit row                     |
| Block/unblock         | Deterministic one-way block, idempotent, closes match/chat, 403 on send, audited                                 |
| Route/security checks | Proxy matcher covers \/messages\; unauthenticated pages 307 to \/login\; conversation API 401                    |
| Quality + evidence    | \evidence/run-2026-10-29-phase3-chat/\: 39 focused tests, 4/4 emulator tests, 181 unit tests, build + smoke pass |
| Still open            | Reports/moderation queue (R-306) and admin roles (R-307)                                                         |

## Phase 3 safety evidence (in progress, 2026-10-29)

| Criterion          | Evidence                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Report intake      | \POST /api/reports\: target user or conversation, category taxonomy, priority mapping, self-report and duplicate guards |
| Moderation queue   | \GET /api/admin/reports\ is staff-only; status filter; non-staff and anonymous callers rejected                         |
| Role gate          | \users/{uid}.role\ of admin/moderator required; ordinary users receive 403                                              |
| Quality + evidence | \evidence/run-2026-10-29-phase3-safety/\: 11 report tests + 4 queue tests, 196/196 unit tests, build pass               |
| Still open         | Append-only moderation actions, audit-log endpoint, appeals                                                             |

## Phase 3 moderation evidence (in progress, 2026-10-29)

| Criterion          | Evidence                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Moderation actions | \POST /api/admin/reports/:id/action\: append-only moderation action + audit row, report status transition, restricted notes |
| Audit log endpoint | \GET /api/admin/audit-logs\: staff-only recent audit feed                                                                   |
| Quality + evidence | \evidence/run-2026-10-29-phase3-safety/\: 5 action tests + 2 audit tests; 203/203 unit tests; build pass                    |
| Still open         | Appeals flow                                                                                                                |

## Phase 3 appeals evidence (2026-10-29)

| Criterion          | Evidence                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Appeal submission  | \POST /api/appeals\: target existence, duplicate guard, account-scoped GET                                           |
| Appeal resolution  | \GET/POST /api/admin/appeals\: staff queue and resolution with audit row                                             |
| Quality + evidence | \evidence/run-2026-10-29-phase3-safety/05-appeals-tests.log\: 7 submission tests + 6 admin tests; full suite 213/213 |
