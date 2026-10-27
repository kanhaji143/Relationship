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

## 3. Open human actions

| Item                                                    | Owner           | Blocks                           |
| ------------------------------------------------------- | --------------- | -------------------------------- |
| Create Firebase project + fill `NEXT_PUBLIC_FIREBASE_*` | Product owner   | Auth (Phase 1), rules deployment |
| `firebase login` + `npm run rules:deploy`               | Product owner   | Rules exit criterion             |
| Install JDK 21+                                         | Dev environment | Firebase Emulator Suite          |
| Add owner requirements in §1                            | Product owner   | Next test-case expansion         |

## 4. Traceability

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
