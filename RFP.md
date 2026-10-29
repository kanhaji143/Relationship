# RFP — Relationship Platform ("Bondora", working name)

**Document status:** baseline captured 2026-10-27 · Firebase Phase 1 E2E verified 2026-10-28 · awaiting owner requirements in §1
**Workflow:** `RFP.md` → `TestCases.md` → execute → `evidence/` → finish
**Project:** privacy-first, consent-led, adults-only (18+) relationship platform, India-first web MVP on Firebase.

---

## 1. Requirement input space (owner)

> Paste or write your requirements between the markers below. Anything you add there becomes the source for new/updated test cases in `TestCases.md`.
> **This area is intentionally empty right now.** Everything in §2 is the approved Phase 0 baseline that was already built, so work could continue without blocking.

<!-- USER-REQUIREMENTS:BEGIN -->

_No owner requirements added yet._

<!-- USER-REQUIREMENTS:END -->

---

## 2. Baseline requirements (Phase 0 — implemented)

These are accepted requirements derived from `docs/PRODUCT_BLUEPRINT.md`, `docs/PHASES.md` and `docs/DECISIONS.md`.

### 2.1 Functional requirements

| ID        | Requirement                                                                      | Acceptance criteria                                                                                                                                                            | Status  |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **R-001** | The web app must boot locally without a Firebase project.                        | `npm run build` succeeds; `/`, `/how-it-works`, `/safety` return 200; unknown routes return 404.                                                                               | ✅ Done |
| **R-002** | Branding must be configurable and the provisional name clearly labelled.         | `NEXT_PUBLIC_BRAND_NAME` changes the rendered brand; default `Bondora` shows "working name" / provisional notice.                                                              | ✅ Done |
| **R-003** | Environment configuration must be validated server-side.                         | Invalid `NEXT_PUBLIC_APP_URL` fails fast with a clear error; empty placeholders fall back to defaults; secret values never appear in errors.                                   | ✅ Done |
| **R-004** | Env tooling must exist for setup and inspection.                                 | `npm run setup:env` creates `.env.local` only when absent; `npm run env:check` reports missing key names (never values).                                                       | ✅ Done |
| **R-005** | Auth-phase input validation must enforce adult-only signup and explicit consent. | Signup rejects under-18s (UTC boundary, leap-day safe), requires terms + privacy consent, normalizes email, enforces 12–128 char password not containing the email local part. | ✅ Done |
| **R-006** | The Firestore data model for auth must be defined before implementation.         | Document types for user, private user, profile, preferences, consent and audit log; single source of truth for collection paths; canonical match ID helper.                    | ✅ Done |
| **R-007** | Direct client access to Firestore and Storage must be denied.                    | Both rules files contain a catch-all `allow read, write: if false` and no permissive rule.                                                                                     | ✅ Done |
| **R-008** | Firebase must be wired for both client and server with local emulator support.   | Client singleton, server-only Admin singleton (ADC/service account), emulator auto-connect, `firebase.json` config.                                                            | ✅ Done |
| **R-009** | Logging must never leak secrets or PII.                                          | Sensitive keys redacted; emails/bearer tokens masked in strings; structured JSON with level, event and UTC time.                                                               | ✅ Done |
| **R-010** | Quality tooling must be runnable from one command.                               | `npm run verify` runs format check, lint, typecheck, unit tests and production build; CI runs the same pipeline.                                                               | ✅ Done |
| **R-011** | Setup and decisions must be documented for humans.                               | `docs/SETUP_FIREBASE.md` walkthrough, phase tracker with exit evidence, append-only decision log, runnable README quick start.                                                 | ✅ Done |
| **R-012** | Every delivery must record tests and evidence.                                   | `RFP.md`, `TestCases.md`, `evidence/` exist; evidence includes command logs, route results and a summary with pass/fail.                                                       | ✅ Done |

### 2.2 Non-functional requirements

| ID          | Requirement             | Acceptance criteria                                                                                       |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| **NFR-001** | Secret hygiene.         | `.env.local` and service-account keys are gitignored and never tracked; logs redact secrets.              |
| **NFR-002** | Accessibility baseline. | Skip link, visible focus ring, semantic landmarks, `prefers-reduced-motion` support, AA-contrast palette. |
| **NFR-003** | Honest claims.          | No E2EE claim; provisional brand labelled; no fake activity; no paywalled safety tools in copy or code.   |
| **NFR-004** | Reproducibility.        | Clean install (`npm ci`) + `npm run verify` passes on Node 22 LTS.                                        |
| **NFR-005** | Safety architecture.    | Browser never talks to Firestore/Storage directly; rules deny by default; authorization is server-side.   |

### 2.3 Explicitly out of scope for Phase 0

Authentication flows, onboarding UI, database writes, discovery, matching, chat, reports/moderation, billing, privacy request workflows, deployment to Firebase.

---

## 3. Phase 1 — Foundations (slice 1A: auth entry + session)

Added 2026-10-28. Phase 1A was implemented without requiring Firebase; the owner then linked the Firebase project and real browser E2E was completed on 2026-10-28.

| ID        | Requirement                                                              | Acceptance criteria                                                                                                                                                                                       | Status                      |
| --------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **R-101** | Auth entry pages must exist and be responsive/accessible.                | `/login`, `/signup`, `/forgot-password` render with labelled fields, inline errors, and a clear "Firebase not configured" state.                                                                          | ✅ Done                     |
| **R-102** | Sessions must be HttpOnly cookies, never client storage.                 | ID token exchanged at `POST /api/auth/session` for a Secure/HttpOnly/SameSite cookie (`__session`); no token written to localStorage/sessionStorage.                                                      | ✅ Done (browser E2E)       |
| **R-103** | Auth endpoints must be CSRF- and abuse-resistant.                        | Same-origin check on every state-changing request; fixed-window rate limit (10 req / 5 min / IP) on login exchange and registration.                                                                      | ✅ Done                     |
| **R-104** | Registration must create only server-authorized records.                 | `POST /api/auth/register` verifies the Firebase ID token, requires 18+ confirmation + terms/privacy consent, and writes `users/{uid}`, consent records, email lookup and an audit log in one transaction. | ✅ Done (Firebase verified) |
| **R-105** | Sessions must be server-authoritative.                                   | `/account` reads the session cookie server-side and redirects unauthenticated visitors to `/login`; UI checks never grant access.                                                                         | ✅ Done                     |
| **R-106** | Auth failures must not leak account existence or tokens.                 | Login errors are generic; tokens/cookies are never logged; forgot-password always returns the same message.                                                                                               | ✅ Done                     |
| **R-107** | Auth code must be unit-tested.                                           | Tests cover rate limiter, origin check, safe redirect, cookie options, hashing, error mapping and new validation schemas.                                                                                 | ✅ Done (84 tests)          |
| **R-108** | Firebase end-to-end auth must be verified before Phase 1 is called done. | signup→login→session→account works against the emulator or a real project.                                                                                                                                | ✅ Done (real Firebase)     |

Legend: ✅ = verified with captured output; 🟡 = implementation present but some acceptance points remain unverified.

### 3.1 Phase 1B — onboarding basics (added 2026-10-28)

| ID        | Requirement                                                                 | Acceptance criteria                                                                                                                                                                                                      | Status                               |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **R-109** | Onboarding must exist and be session-protected.                             | `/onboarding` collects display name, birth date, intent, broad region, languages, bio and interests; unauthenticated visitors are redirected to `/login` before any HTML.                                                | ✅ Done (browser verified)           |
| **R-110** | The 18+ gate must be enforced on the server during onboarding.              | Under-18 birth dates are rejected with `403 underage` regardless of client validation; the client check is feedback only.                                                                                                | ✅ Done (API 403 verified)           |
| **R-111** | Onboarding saves must be atomic, idempotent and server-authorized.          | `POST /api/onboarding` derives the uid from the session cookie and writes `profiles/{uid}`, `preferences/{uid}`, the private age declaration and an audit log in one transaction, preserving existing fields on re-save. | ✅ Done (Firebase verified)          |
| **R-112** | Location and profile data must stay privacy-safe and allow-listed.          | Country is fixed to IN; regions are broad enums (no city/precise location); languages and interests come from allow-lists; bios are sanitized; exact birth date stays in the private user subcollection.                 | ✅ Done (tests + Firestore verified) |
| **R-113** | The account page must reflect onboarding state.                             | Signed-in users see either a "Complete profile" CTA or their saved profile summary; Edit profile pre-fills values including DOB from the private document.                                                               | ✅ Done (browser verified)           |
| **R-114** | Onboarding end-to-end must be verified with Firebase before Phase 1 closes. | signup → onboarding save → account shows the profile against emulator or a real project.                                                                                                                                 | ✅ Done (real Firebase)              |

### 3.2 Phase 1C — prompts + discovery preferences (added 2026-10-28)

| ID        | Requirement                                                          | Acceptance criteria                                                                                                                                                            | Status                                 |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **R-115** | Profile prompts must be editable and server-authorized.              | Owner may save 0–3 answers from an approved prompt catalog; answers are bounded/sanitized; Firestore `prompts` records are replaced atomically from the session uid.           | ✅ Done (Firebase verified)            |
| **R-116** | Discovery filters must remain distinct from relationship intent.     | `/settings/discovery` edits age range, compatible intents, broad regions, languages and discovery pause; it never overwrites the user's own `preferences.intent`.              | ✅ Done (Firebase verified)            |
| **R-117** | Preference input must be allow-listed and privacy-preserving.        | Server validates 18–99 age bounds, 1–2 intents, allowed broad regions/languages; no city, exact distance or precise location is collected.                                     | ✅ Done (tests + Firebase verified)    |
| **R-118** | Photo upload must use a private, validated storage pipeline.         | Server-authorized upload, private object path, MIME/size limits, EXIF stripping, moderation state, short-lived signed read URLs; direct client access denied by Storage rules. | ✅ Done (server pipeline + tests)      |
| **R-119** | Prompt and preference flows must be verified against real Firestore. | Authenticated save → reload/prefill works; unauthorized and malformed requests are rejected; audit records are present.                                                        | ✅ Done (browser + Firestore verified) |

### 3.3 Phase 2 — Discovery & matching (added 2026-10-28)

| ID        | Requirement                                                    | Acceptance criteria                                                                                                                  | Status                             |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **R-201** | Discovery candidates must be filtered server-side.             | Eligibility checks account status, visibility, moderation, blocks, intent compatibility, age range, region and language preferences. | ✅ Done (mocked route tests)       |
| **R-202** | Candidate ranking must be deterministic and explainable.       | Compatibility score blends age/language (40%), shared interests (30%), prompt answers (20%) and freshness (10%), clamped [0,1].      | ✅ Done (unit-tested)              |
| **R-203** | Like/pass actions must be server-authorized and idempotent.    | `POST /api/discover/like` derives uid from session, validates target, records action, creates match + conversation on mutual like.   | ✅ Done (mocked transaction tests) |
| **R-204** | Self and duplicate likes must be prevented.                    | Self-action returns 400; re-recording same action returns `already_recorded`; changing action updates the record.                    | ✅ Done (route tests)              |
| **R-205** | Discovery, likes and matches pages must be session-protected.  | `/discover`, `/likes`, `/matches` redirect unauthenticated visitors to `/login` before rendering.                                    | ✅ Done (route smoke)              |
| **R-206** | Candidate feed must exclude already-seen and blocked users.    | Already liked/passed users and blocked pairs are filtered from the candidate list.                                                   | ✅ Done (mocked route tests)       |
| **R-207** | Discovery and matching must be verified against Firestore.     | Authenticated candidate fetch, like, mutual match and conversation creation work end-to-end against the emulator or linked project.  | ✅ Done (emulator + live verified) |
| **R-208** | Discovery/matching E2E must be captured before Phase 2 closes. | Full like→match→conversation flow verified against the emulator or linked Firebase with audit records.                               | ✅ Done (emulator + live verified) |

### 3.4 Phase 3 — Chat, safety & moderation (added 2026-10-29)

| ID        | Requirement                                                | Acceptance criteria                                                                                                                       | Status                           |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **R-301** | Chat must be participant-only.                             | A conversation is readable/writable only by the two matched participants; non-participants receive 404 so thread existence is not leaked. | ✅ Done (route + emulator tests) |
| **R-302** | Messages must be validated and rate-limited server-side.   | Text-only, 1–1000 trimmed characters, control characters rejected, uid from session, 30 messages/minute/user, server timestamp on write.  | ✅ Done (tests)                  |
| **R-303** | Conversation list and thread must be account-scoped.       | `/messages` lists only the viewer's active matches with partner summary and last message; blocked/unmatched threads are hidden.           | ✅ Done (emulator verified)      |
| **R-304** | Unmatch must end chat for both participants.               | Participant-only, idempotent, sets match `unmatched` and conversation `closed`, records an audit event; further sends return 409.         | ✅ Done (route + emulator)       |
| **R-305** | Blocking must immediately stop contact in both directions. | One-way deterministic block, self-block rejected, repeat is idempotent, closes active match/chat, and all chat sends return 403.          | ✅ Done (route + emulator)       |
| **R-306** | Reports must enter a moderation queue.                     | Allowed category taxonomy, target user or conversation required, priority mapping, reporter cannot report themselves, duplicate guard.    | ✅ Done (route tests)            |
| **R-307** | Admin/moderator actions must be role-gated and audited.    | Admin routes reject non-staff; moderation actions are append-only with reason codes and restricted notes; audit-log feed is staff-only.   | ✅ Done (actions + audit log)    |
| **R-308** | Phase 3 E2E must be captured before the phase closes.      | Send/read, non-participant denial, unmatch and block flows pass against the emulator with cleanup and evidence.                           | ✅ Done (emulator verified)      |
| **R-309** | Appeals must be submittable and reviewable.                | Authenticated users can appeal a moderation action or report; staff can list and resolve appeals; duplicate open appeals are rejected.    | ✅ Done (route tests)            |

## 4. Open human actions

| Item                                                                  | Owner           | Blocks                                                         |
| --------------------------------------------------------------------- | --------------- | -------------------------------------------------------------- |
| Create Firebase project + fill `NEXT_PUBLIC_FIREBASE_*` + Admin ADC   | Product owner   | ✅ Done (local dev configured)                                 |
| `firebase login` + `npm run rules:deploy`                             | Product owner   | ✅ Done (TC-021)                                               |
| Install JDK 21+                                                       | Dev environment | ✅ Installed locally for TC-022/TC-051                         |
| Approve controlled live Firebase test writes                          | Product owner   | ✅ Approved in chat (2026-10-29)                               |
| Run live Phase 2 Firebase spot-check with synthetic accounts          | Agent           | ✅ Done (TC-052); fixtures deleted, 2 audit rows retained      |
| Approve Storage privacy controls (UBLA/PAP) + server signing identity | Product owner   | ✅ Approved in chat (2026-10-29) — server pipeline implemented |
| Add owner requirements in §1                                          | Product owner   | Next test-case expansion                                       |

## 5. Traceability

| Requirement | Test cases                             |
| ----------- | -------------------------------------- |
| R-001       | TC-011, TC-012                         |
| R-002       | TC-013                                 |
| R-003       | TC-010                                 |
| R-004       | TC-014                                 |
| R-005       | TC-005, TC-006, TC-007                 |
| R-006       | TC-008                                 |
| R-007       | TC-015                                 |
| R-008       | TC-016                                 |
| R-009       | TC-009                                 |
| R-010       | TC-001, TC-002, TC-003, TC-004, TC-018 |
| R-011       | TC-017                                 |
| R-012       | TC-019, TC-020                         |
| NFR-001     | TC-020                                 |
| R-101       | TC-024                                 |
| R-102       | TC-025, TC-030                         |
| R-103       | TC-026, TC-027                         |
| R-104       | TC-028                                 |
| R-105       | TC-029                                 |
| R-106       | TC-030, TC-033                         |
| R-107       | TC-031                                 |
| R-108       | TC-032                                 |
| R-109       | TC-034, TC-035                         |
| R-110       | TC-036                                 |
| R-111       | TC-037                                 |
| R-112       | TC-035, TC-040                         |
| R-113       | TC-038                                 |
| R-114       | TC-039                                 |
| R-115       | TC-041, TC-042                         |
| R-116       | TC-043                                 |
| R-117       | TC-042, TC-043                         |
| R-118       | TC-045, TC-067                         |
| R-119       | TC-041, TC-043, TC-044                 |
| R-201       | TC-046, TC-047, TC-050                 |
| R-202       | TC-047                                 |
| R-203       | TC-048, TC-051                         |
| R-204       | TC-048                                 |
| R-205       | TC-049                                 |
| R-206       | TC-046, TC-050                         |
| R-207       | TC-051, TC-052                         |
| R-208       | TC-051, TC-052                         |
| R-301       | TC-053, TC-054, TC-059, TC-060         |
| R-302       | TC-053                                 |
| R-303       | TC-054, TC-059, TC-060                 |
| R-304       | TC-055, TC-059                         |
| R-305       | TC-056, TC-059                         |
| R-306       | TC-057, TC-061                         |
| R-307       | TC-058, TC-062, TC-063, TC-064         |
| R-308       | TC-059                                 |
| R-309       | TC-065, TC-066                         |
