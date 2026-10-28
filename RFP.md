# RFP — Relationship Platform ("Bondora", working name)

**Document status:** baseline captured 2026-10-27 · awaiting owner requirements in §1
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

Added 2026-10-28. Scope is deliberately limited to what can be built and tested without a Firebase project; end-to-end Firebase flows stay blocked.

| ID        | Requirement                                                              | Acceptance criteria                                                                                                                                                                                       | Status                            |
| --------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **R-101** | Auth entry pages must exist and be responsive/accessible.                | `/login`, `/signup`, `/forgot-password` render with labelled fields, inline errors, and a clear "Firebase not configured" state.                                                                          | ✅ Done                           |
| **R-102** | Sessions must be HttpOnly cookies, never client storage.                 | ID token exchanged at `POST /api/auth/session` for a Secure/HttpOnly/SameSite cookie (`__session`); no token written to localStorage/sessionStorage.                                                      | 🟡 Built; issuance E2E blocked    |
| **R-103** | Auth endpoints must be CSRF- and abuse-resistant.                        | Same-origin check on every state-changing request; fixed-window rate limit (10 req / 5 min / IP) on login exchange and registration.                                                                      | ✅ Done                           |
| **R-104** | Registration must create only server-authorized records.                 | `POST /api/auth/register` verifies the Firebase ID token, requires 18+ confirmation + terms/privacy consent, and writes `users/{uid}`, consent records, email lookup and an audit log in one transaction. | 🟡 Built; transaction E2E blocked |
| **R-105** | Sessions must be server-authoritative.                                   | `/account` reads the session cookie server-side and redirects unauthenticated visitors to `/login`; UI checks never grant access.                                                                         | ✅ Done                           |
| **R-106** | Auth failures must not leak account existence or tokens.                 | Login errors are generic; tokens/cookies are never logged; forgot-password always returns the same message.                                                                                               | ✅ Done                           |
| **R-107** | Auth code must be unit-tested.                                           | Tests cover rate limiter, origin check, safe redirect, cookie options, hashing, error mapping and new validation schemas.                                                                                 | ✅ Done (72 tests)                |
| **R-108** | Firebase end-to-end auth must be verified before Phase 1 is called done. | signup→login→session→account works against the emulator or a real project.                                                                                                                                | ⛔ Blocked (no project/JDK)       |

Legend: ✅ = verified with captured output; 🟡 = code complete + unit/static checks, but the Firebase-dependent execution is still blocked (TC-028, TC-032).

### 3.1 Phase 1B — onboarding basics (added 2026-10-28)

| ID        | Requirement                                                                 | Acceptance criteria                                                                                                                                                                                                      | Status                            |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **R-109** | Onboarding must exist and be session-protected.                             | `/onboarding` collects display name, birth date, intent, broad region, languages, bio and interests; unauthenticated visitors are redirected to `/login` before any HTML.                                                | 🟡 Built; E2E blocked             |
| **R-110** | The 18+ gate must be enforced on the server during onboarding.              | Under-18 birth dates are rejected with `403 underage` regardless of client validation; the client check is feedback only.                                                                                                | ✅ Done (unit-tested)             |
| **R-111** | Onboarding saves must be atomic, idempotent and server-authorized.          | `POST /api/onboarding` derives the uid from the session cookie and writes `profiles/{uid}`, `preferences/{uid}`, the private age declaration and an audit log in one transaction, preserving existing fields on re-save. | 🟡 Built; transaction E2E blocked |
| **R-112** | Location and profile data must stay privacy-safe and allow-listed.          | Country is fixed to IN; regions are broad enums (no city/precise location); languages and interests come from allow-lists; bios are length-capped and sanitized.                                                         | ✅ Done (unit-tested)             |
| **R-113** | The account page must reflect onboarding state.                             | Signed-in users see either a "Complete profile" CTA or their saved profile summary (name, intent, broad region, languages, interests).                                                                                   | 🟡 Built; E2E blocked             |
| **R-114** | Onboarding end-to-end must be verified with Firebase before Phase 1 closes. | signup → onboarding save → account shows the profile against emulator or a real project.                                                                                                                                 | ⛔ Blocked (no project/JDK)       |

## 4. Open human actions

| Item                                                    | Owner           | Blocks                           |
| ------------------------------------------------------- | --------------- | -------------------------------- |
| Create Firebase project + fill `NEXT_PUBLIC_FIREBASE_*` | Product owner   | Auth (Phase 1), rules deployment |
| `firebase login` + `npm run rules:deploy`               | Product owner   | Rules exit criterion             |
| Install JDK 21+                                         | Dev environment | Firebase Emulator Suite          |
| Add owner requirements in §1                            | Product owner   | Next test-case expansion         |

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
| R-112       | TC-036                                 |
| R-113       | TC-038                                 |
| R-114       | TC-039                                 |
