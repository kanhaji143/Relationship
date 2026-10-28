# Test Cases — Phase 0 baseline + Phase 1A/1B auth & onboarding

**Generated from:** `RFP.md` §2 (Phase 0), §3 (Phase 1A) and §3.1 (Phase 1B)
**Executed:** 2026-10-27 (Phase 0) · Phase 1A verified 2026-10-28 · Phase 1B verified 2026-10-28
**Latest evidence:** `evidence/run-2026-10-28-phase1b/`
**Result:** **32/39 passed · 7 blocked · 0 failed**
**Rule:** a case is only PASS when its command/output is captured in the evidence folder. Missing prerequisites produce a BLOCKED result, never a fake pass.

## Environment

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| OS               | Windows (win32, x64)                     |
| Node             | v24.20.0                                 |
| npm              | 11.19.0                                  |
| Next.js          | 16.4.3                                   |
| Test runner      | Vitest 5.0.5                             |
| Firebase CLI     | 15.34.0                                  |
| Java             | ❌ not installed (blocks emulators)      |
| Firebase project | ❌ not created (blocks rules deployment) |
| Git at run time  | `master@d8269b4` + Phase 1A working tree |

## Summary

| ID     | Test                              | Requirement      | Status                           |
| ------ | --------------------------------- | ---------------- | -------------------------------- |
| TC-001 | Formatting gate                   | R-010, NFR-004   | ✅ PASS                          |
| TC-002 | Lint gate                         | R-010            | ✅ PASS                          |
| TC-003 | Typecheck gate                    | R-010            | ✅ PASS                          |
| TC-004 | Full unit suite                   | R-010            | ✅ PASS                          |
| TC-005 | 18+ age gate boundary             | R-005            | ✅ PASS                          |
| TC-006 | Consent + password policy         | R-005            | ✅ PASS                          |
| TC-007 | Email normalization/rejection     | R-005            | ✅ PASS                          |
| TC-008 | Canonical match + paths           | R-006            | ✅ PASS                          |
| TC-009 | Log redaction                     | R-009, NFR-001   | ✅ PASS                          |
| TC-010 | Env validation                    | R-003            | ✅ PASS                          |
| TC-011 | Production build                  | R-001            | ✅ PASS                          |
| TC-012 | Route smoke (200/404)             | R-001            | ✅ PASS                          |
| TC-013 | Brand override                    | R-002            | ✅ PASS                          |
| TC-014 | Env bootstrap/check               | R-004            | ✅ PASS                          |
| TC-015 | Rules deny by default             | R-007, NFR-005   | ✅ PASS                          |
| TC-016 | Firebase wiring + emulator config | R-008            | ✅ PASS                          |
| TC-017 | Docs presence + valid links       | R-011            | ✅ PASS                          |
| TC-018 | CI parity                         | R-010            | ✅ PASS                          |
| TC-019 | Evidence reproducibility          | R-012            | ✅ PASS                          |
| TC-020 | Secret hygiene                    | NFR-001          | ✅ PASS                          |
| TC-021 | Deploy security rules             | R-007            | ⛔ BLOCKED (no Firebase project) |
| TC-022 | Start Firebase emulators          | R-008            | ⛔ BLOCKED (no JDK 21+)          |
| TC-023 | Accessibility + honest claims     | NFR-002, NFR-003 | ✅ PASS                          |
| TC-024 | Auth pages render                 | R-101            | ✅ PASS                          |
| TC-025 | Session cookie hardening          | R-102            | ✅ PASS                          |
| TC-026 | CSRF origin rejection             | R-103            | ✅ PASS                          |
| TC-027 | Auth rate limiting                | R-103            | ✅ PASS                          |
| TC-028 | Registration transaction          | R-104            | ⛔ BLOCKED (no Firebase project) |
| TC-029 | Protected account route           | R-105            | ✅ PASS                          |
| TC-030 | No browser token storage          | R-102, R-106     | ✅ PASS                          |
| TC-031 | Auth utility unit coverage        | R-107            | ✅ PASS                          |
| TC-032 | End-to-end Firebase auth          | R-108            | ⛔ BLOCKED (no project/JDK)      |
| TC-033 | Generic auth error copy           | R-106            | ✅ PASS                          |
| TC-034 | Onboarding page protection        | R-109            | ✅ PASS                          |
| TC-035 | Onboarding validation rules       | R-110, R-112     | ✅ PASS                          |
| TC-036 | Onboarding API guards             | R-109, R-110     | ✅ PASS                          |
| TC-037 | Atomic onboarding save            | R-111            | ⛔ BLOCKED (no Firebase project) |
| TC-038 | Account reflects profile          | R-113            | ⛔ BLOCKED (no Firebase project) |
| TC-039 | Onboarding end-to-end             | R-114            | ⛔ BLOCKED (no project/JDK)      |

---

## TC-001 — Formatting gate

- **Requirement:** R-010, NFR-004
- **Preconditions:** dependencies installed.
- **Steps:**
  1. Run `npm run format:check`.
  2. Confirm exit code is 0.
  3. Confirm no file is reported as unformatted.
- **Expected outcome:** Prettier reports all matched files as formatted; exit code 0.
- **Validation points:** exit code, unformatted file list, generated evidence excluded from formatting.
- **Evidence:** `evidence/phase0-2026-10-27/01.log`
- **Actual:** PASS — exit 0 in 4.2 s; all matched files formatted.
- **Status:** ✅ PASS

## TC-002 — Lint gate

- **Requirement:** R-010
- **Preconditions:** ESLint flat config present.
- **Steps:**
  1. Run `npm run lint`.
  2. Confirm exit code is 0.
- **Expected outcome:** No ESLint errors or warnings.
- **Validation points:** exit code; app, lib, scripts and tests all linted.
- **Evidence:** `evidence/phase0-2026-10-27/02.log`
- **Actual:** PASS — exit 0 in 9.1 s; no findings.
- **Status:** ✅ PASS

## TC-003 — Typecheck gate

- **Requirement:** R-010
- **Preconditions:** `tsconfig.json` strict mode enabled.
- **Steps:**
  1. Run `npm run typecheck` (`tsc --noEmit`).
  2. Confirm exit code is 0.
- **Expected outcome:** No TypeScript errors under `strict: true`.
- **Validation points:** exit code; no `any`-suppression added to pass.
- **Evidence:** `evidence/phase0-2026-10-27/03.log`
- **Actual:** PASS — exit 0 in 7.3 s; no errors.
- **Status:** ✅ PASS

## TC-004 — Full unit suite

- **Requirement:** R-010
- **Preconditions:** Vitest config resolves `@/` and mocks `server-only`.
- **Steps:**
  1. Run `npm test`.
  2. Confirm 5 test files and 32 tests pass.
- **Expected outcome:** 0 failed tests; exit code 0.
- **Validation points:** test count, file count, no skipped tests.
- **Evidence:** `evidence/phase0-2026-10-27/04.log`
- **Actual:** PASS — 5 files, 32/32 tests passed in 1.31 s; exit 0.
- **Status:** ✅ PASS

## TC-005 — 18+ age gate boundary

- **Requirement:** R-005
- **Preconditions:** `lib/validation/auth.ts` imported by the test.
- **Steps:**
  1. Evaluate a birth date exactly 18 years before the reference date.
  2. Evaluate one day short of 18.
  3. Evaluate a leap-day birth date before/after the birthday in a non-leap year.
  4. Evaluate `1990-02-30` (impossible calendar date).
  5. Run `npx vitest run lib/validation/auth.test.ts`.
- **Expected outcome:** Exact birthday accepted; one-day-short rejected; leap-day handled; impossible date rejected.
- **Validation points:** UTC day comparison (no timezone drift), no silent date rollover.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`age gate` block)
- **Actual:** PASS — boundary accepted (`2008-10-27`), one day short rejected (`2008-10-28`), leap-day sequence correct, impossible date rejected.
- **Status:** ✅ PASS

## TC-006 — Consent + password policy

- **Requirement:** R-005
- **Preconditions:** signup schema imported.
- **Steps:**
  1. Submit a valid adult signup.
  2. Submit with `acceptedTerms: false`; then `acceptedPrivacy: false`.
  3. Submit a 5-character password.
  4. Submit a password containing the email local part.
- **Expected outcome:** Only the valid signup is accepted; every variant fails with an issue on the correct field.
- **Validation points:** explicit `literal(true)` consent, 12–128 character policy, email-local-part check.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`signupSchema` block)
- **Actual:** PASS — all 6 signup assertions passed.
- **Status:** ✅ PASS

## TC-007 — Email normalization/rejection

- **Requirement:** R-005
- **Preconditions:** email schema imported.
- **Steps:**
  1. Parse `"  Asha.P@Example.COM "`.
  2. Parse `not-an-email`.
  3. Parse `a@b`.
- **Expected outcome:** Normalized `asha.p@example.com`; malformed addresses rejected.
- **Validation points:** trim + lowercase, format check, 254-character cap.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`emailSchema` block)
- **Actual:** PASS — normalization and both rejections confirmed.
- **Status:** ✅ PASS

## TC-008 — Canonical match ID + document paths

- **Requirement:** R-006
- **Preconditions:** `lib/firebase/collections.ts` imported.
- **Steps:**
  1. Call `canonicalMatchId("zeta", "alpha")` and `("alpha", "zeta")`.
  2. Call `canonicalMatchId("u2", "u1")` vs `("u1", "u2")`.
  3. Check `userPrivateDoc` and `messageDoc` paths.
- **Expected outcome:** Same ID for a pair regardless of argument order; private data stays in a subcollection; messages nest under a conversation.
- **Validation points:** deterministic pair ID; no collision across ordering.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`canonicalMatchId` block)
- **Actual:** PASS — `alpha_zeta` in both orders; `users/u1/private/ageAssurance`; `conversations/m1/messages/msg1`.
- **Status:** ✅ PASS

## TC-009 — Log redaction

- **Requirement:** R-009, NFR-001
- **Preconditions:** logger imported.
- **Steps:**
  1. Redact `{ password, token, authorization, cookie, safe }`.
  2. Redact a nested `{ user: { email: ... } }`.
  3. Redact strings containing an email and `Bearer <token>`.
  4. Emit `logger.info` and parse the JSON line.
  5. Emit `logger.debug` at default level.
- **Expected outcome:** Sensitive keys → `[redacted]`, emails/tokens masked, JSON has level/event/time, debug suppressed by default.
- **Validation points:** no secret value in output; nested objects handled.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`redact`/`logger` blocks)
- **Actual:** PASS — 6 logger assertions passed, including nested redaction and debug suppression.
- **Status:** ✅ PASS

## TC-010 — Environment validation

- **Requirement:** R-003
- **Preconditions:** env module loaded with test stubs.
- **Steps:**
  1. Load env with empty `NEXT_PUBLIC_APP_URL` and brand.
  2. Set `NEXT_PUBLIC_APP_URL=not-a-url`.
  3. Set a Razorpay secret plus an invalid URL and inspect the error.
  4. Load with empty Firebase values, then with complete values.
- **Expected outcome:** Defaults applied for empty placeholders; invalid URL fails fast; secret value never appears in the error; Firebase configured detection flips correctly.
- **Validation points:** `EnvValidationError` type, field-path messages only, `assertFirebaseConfigured` actionable message.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`server environment` block)
- **Actual:** PASS — 5/5 assertions; defaults applied; secret not present in error output.
- **Status:** ✅ PASS

## TC-011 — Production build

- **Requirement:** R-001
- **Preconditions:** `.env.local` exists (Firebase values may be empty).
- **Steps:**
  1. Run `npm run build`.
  2. Confirm compile + TypeScript phase passes.
  3. Confirm static routes: `/`, `/_not-found`, `/how-it-works`, `/safety`.
- **Expected outcome:** Build exits 0 without Firebase credentials.
- **Validation points:** static prerender count, route list, no env crash.
- **Evidence:** `evidence/phase0-2026-10-27/05.log`
- **Actual:** PASS — exit 0 in 15.2 s; 4 static routes generated; no Firebase credentials needed.
- **Status:** ✅ PASS

## TC-012 — Route smoke (HTTP)

- **Requirement:** R-001
- **Preconditions:** production build available.
- **Steps:**
  1. Start `next start` on port 3210.
  2. GET `/` → expect 200 and the hero headline.
  3. GET `/how-it-works` → expect 200 and page content.
  4. GET `/safety` → expect 200 and page content.
  5. GET `/definitely-not-a-route` → expect 404 and "Page not found".
  6. Stop the server.
- **Expected outcome:** All statuses and content markers match; server shuts down cleanly.
- **Validation points:** status code, title, H1, body contains expected copy.
- **Evidence:** `evidence/phase0-2026-10-27/06-route-smoke.log`, `06-route-smoke.json`
- **Actual:** PASS — `/` 200, `/how-it-works` 200, `/safety` 200, unknown 404; titles and H1s correct; port 3210 released.
- **Status:** ✅ PASS

## TC-013 — Brand override

- **Requirement:** R-002
- **Preconditions:** brand module imported after env stubs.
- **Steps:**
  1. Load brand with empty `NEXT_PUBLIC_BRAND_NAME`.
  2. Load with `NEXT_PUBLIC_BRAND_NAME="Example Co"`.
  3. Load with empty `NEXT_PUBLIC_APP_URL`.
- **Expected outcome:** Default → `Bondora` + provisional; override → `Example Co` + non-provisional; URL falls back to localhost.
- **Validation points:** provisional flag derives from the name; no hard-coded brand leaks.
- **Evidence:** `evidence/phase0-2026-10-27/04.log` (`brand config` block)
- **Actual:** PASS — 3/3 assertions.
- **Status:** ✅ PASS

## TC-014 — Env bootstrap/check tooling

- **Requirement:** R-004
- **Preconditions:** `.env.example` present; `.env.local` exists.
- **Steps:**
  1. Run `npm run setup:env` twice.
  2. Run `npm run env:check`.
  3. Confirm only key names are printed (no values).
- **Expected outcome:** First run reports created/skip safely; second run leaves the file untouched; check lists 18 keys and Firebase 0/6 when empty; no secret values printed.
- **Validation points:** never overwrites, exit code 0 when keys are present, no value leakage.
- **Evidence:** `evidence/phase0-2026-10-27/07.log`
- **Actual:** PASS — 18 keys found; Firebase 0/6 filled; only key names reported; exit 0.
- **Status:** ✅ PASS

## TC-015 — Firestore/Storage rules deny by default

- **Requirement:** R-007, NFR-005
- **Preconditions:** rules files present.
- **Steps:**
  1. Assert `firestore.rules` contains a catch-all `allow read, write: if false`.
  2. Assert `storage.rules` contains the same.
  3. Assert neither file contains `allow ... if true`.
  4. Assert `firebase.json` points to both rules files.
- **Expected outcome:** All assertions pass.
- **Validation points:** catch-all scope (`{document=**}` / `{allPaths=**}`), no permissive exception.
- **Evidence:** `evidence/phase0-2026-10-27/08.log`
- **Actual:** PASS — 5/5 static assertions.
- **Status:** ✅ PASS (static) · deployment is TC-021 (blocked)

## TC-016 — Firebase wiring + emulator config

- **Requirement:** R-008
- **Preconditions:** Firebase modules present.
- **Steps:**
  1. Confirm client SDK wires Auth + Firestore emulators behind `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`.
  2. Confirm Admin module imports `server-only` and supports ADC + service-account path.
  3. Confirm `firebase.json` emulator ports: Auth 9099, Firestore 8080, Storage 9199, UI 4000.
  4. Confirm no API key is hard-coded.
- **Expected outcome:** All wiring present; no credentials hard-coded.
- **Validation points:** static inspection only (runtime emulator check is TC-022, blocked).
- **Evidence:** `evidence/phase0-2026-10-27/12.log`
- **Actual:** PASS — 4/4 assertions.
- **Status:** ✅ PASS (static) · runtime emulator is TC-022 (blocked)

## TC-017 — Docs presence + valid links

- **Requirement:** R-011
- **Preconditions:** repo docs committed.
- **Steps:**
  1. Assert required files exist: `RFP.md`, `TestCases.md`, `README.md`, `docs/SETUP_FIREBASE.md`, `docs/PHASES.md`, `docs/DECISIONS.md`.
  2. Extract relative links from `README.md`.
  3. Assert every relative link resolves to an existing path.
- **Expected outcome:** No missing files and no broken relative links.
- **Validation points:** link targets, not just rendered text.
- **Evidence:** `evidence/phase0-2026-10-27/10.log`
- **Actual:** PASS — all required docs present; 0 broken relative links.
- **Status:** ✅ PASS

## TC-018 — CI parity

- **Requirement:** R-010
- **Preconditions:** workflow file present.
- **Steps:**
  1. Read `.github/workflows/ci.yml`.
  2. Assert it runs `format:check`, `lint`, `typecheck`, `test`, `build`.
- **Expected outcome:** CI runs the same gates as `npm run verify`.
- **Validation points:** command mismatch would let regressions through.
- **Evidence:** `evidence/phase0-2026-10-27/10.log`
- **Actual:** PASS — all five gates present.
- **Status:** ✅ PASS

## TC-019 — Evidence reproducibility

- **Requirement:** R-012
- **Preconditions:** `scripts/run-evidence.mjs` present.
- **Steps:**
  1. Run `npm run evidence`.
  2. Confirm `summary.json` and `summary.md` are written.
  3. Confirm every result has a corresponding log file.
  4. Confirm totals match the number of executed checks.
- **Expected outcome:** All executed checks PASS and evidence files exist.
- **Validation points:** no PASS without a log; timestamps and git commit recorded.
- **Evidence:** `evidence/phase0-2026-10-27/summary.json`, `summary.md`
- **Actual:** PASS — 12/12 checks; all logs present; environment + commit recorded (44.5 s baseline run, 207.1 s re-run).
- **Status:** ✅ PASS

## TC-020 — Secret hygiene

- **Requirement:** NFR-001
- **Preconditions:** git repo initialised.
- **Steps:**
  1. Run `git check-ignore .env.local` → expect exit 0.
  2. List tracked files and assert none match `.env*` (except `.env.example`), `firebase-adminsdk*`, `serviceAccountKey*`.
- **Expected outcome:** No secret-bearing file is tracked.
- **Validation points:** ignore rule + tracked-file scan (belt and braces).
- **Evidence:** `evidence/phase0-2026-10-27/09.log`
- **Actual:** PASS — 2/2 assertions; `.env.local` ignored; 0 secret files tracked.
- **Status:** ✅ PASS

## TC-021 — Deploy security rules

- **Requirement:** R-007
- **Preconditions:** Firebase project exists, `firebase login` done, project linked in `.firebaserc`.
- **Steps:**
  1. `firebase use --add` → select project.
  2. `npm run rules:deploy`.
  3. Open console → Rules; confirm deny-all for Firestore and Storage.
- **Expected outcome:** Both rule sets deploy successfully.
- **Validation points:** project id matches, deploy output, console view.
- **Evidence:** _none — not executed_
- **Actual:** Not executed — no Firebase project exists; `.firebaserc` still contains the placeholder `YOUR_FIREBASE_PROJECT_ID`.
- **Status:** ⛔ BLOCKED — requires product-owner action (`docs/SETUP_FIREBASE.md` §1, §4, §5)

## TC-022 — Start Firebase emulators

- **Requirement:** R-008
- **Preconditions:** JDK 21+ installed; `firebase setup:emulators:firestore` completed.
- **Steps:**
  1. `npm run emulators`.
  2. Confirm Auth 9099, Firestore 8080, Storage 9199, UI 4000.
  3. Open UI and confirm the `demo-bondora` project.
- **Expected outcome:** Emulator suite starts and is reachable.
- **Validation points:** all four ports, emulator UI load, no Java error.
- **Evidence:** _none — not executed_
- **Actual:** Not executed — `java -version` fails on this machine.
- **Status:** ⛔ BLOCKED — requires JDK 21+ installation

## TC-023 — Accessibility + honest claims

- **Requirement:** NFR-002, NFR-003
- **Preconditions:** layout, global CSS and marketing pages present.
- **Steps:**
  1. Assert skip link (`href="#main"`) exists in the root layout.
  2. Assert `:focus-visible` styles exist.
  3. Assert `prefers-reduced-motion` handling exists.
  4. Assert the provisional "working name" label is rendered.
  5. Assert no UI page makes a positive end-to-end-encryption claim (a denial is allowed).
- **Expected outcome:** All five assertions pass.
- **Validation points:** static markers only (full WCAG audit is Phase 5).
- **Evidence:** `evidence/phase0-2026-10-27/11.log`
- **Actual:** PASS — 5/5 assertions (first run failed on an over-broad regex; the check was corrected and the full run re-executed — see execution log).
- **Status:** ✅ PASS

## TC-024 — Auth pages render

- **Requirement:** R-101
- **Preconditions:** production build succeeds (`npm run build`).
- **Steps:**
  1. Start the production server on an isolated port (`next start`).
  2. `GET /login` and assert 200 + "Welcome back".
  3. `GET /signup` and assert 200 + "Create your account".
  4. `GET /forgot-password` and assert 200 + "Reset your password".
- **Expected outcome:** All three pages return 200 with their heading and a rendered form.
- **Validation points:** status codes, page titles, h1 text captured in the smoke JSON.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/06-route-smoke.json`, `06-route-smoke.log`
- **Actual:** PASS — `/login` 200 "Welcome back", `/signup` 200 "Create your account", `/forgot-password` 200 "Reset your password". All three expose labelled email/password fields with `autoComplete` hints; submit is disabled with a setup notice while Firebase is unconfigured.
- **Status:** ✅ PASS

## TC-025 — Session cookie hardening

- **Requirement:** R-102
- **Preconditions:** session cookie module imported by unit tests; production server running.
- **Steps:**
  1. Run `npx vitest run lib/session/cookie.test.ts`.
  2. Assert cookie name `__session`, `httpOnly: true`, `sameSite: "lax"`, `path: "/"`.
  3. Assert `secure` is `true` only when production.
  4. Send `DELETE /api/auth/session` and inspect the `Set-Cookie` header.
- **Expected outcome:** Cookie is never JS-readable; cleared cookie has `Max-Age=0`.
- **Validation points:** cookie attributes, clearing behaviour, 5-day lifetime (`SESSION_MAX_AGE_SECONDS`).
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/04.log`, `06-route-smoke.json` (DELETE check), `13.log`
- **Actual:** PASS — 2/2 cookie tests pass; DELETE returned 200 with `__session=` and `Max-Age=0` (asserted by the smoke runner). Cookie value is issued by Firebase Admin `createSessionCookie`; real issuance is covered by blocked TC-032.
- **Status:** ✅ PASS

## TC-026 — CSRF origin rejection

- **Requirement:** R-103
- **Preconditions:** production server running; no Firebase credentials required.
- **Steps:**
  1. `POST /api/auth/session` and `/api/auth/register` **without** an `Origin` header.
  2. Assert both return 403 `forbidden_origin`.
  3. Repeat the session POST with `Origin` equal to the server origin; assert it passes the origin gate.
- **Expected outcome:** Missing/foreign origins are rejected before any token work; same-origin requests continue to normal handling.
- **Validation points:** status codes, error codes, order of checks (origin before Firebase config).
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/06-route-smoke.json`, `lib/http/origin.test.ts`
- **Actual:** PASS — both endpoints returned 403 without Origin; same-origin session POST reached the next gate and returned 503 `auth_not_configured` (expected on this build). 5/5 origin unit tests pass.
- **Status:** ✅ PASS

## TC-027 — Auth rate limiting

- **Requirement:** R-103
- **Preconditions:** fixed-window limiter module.
- **Steps:**
  1. Run `npx vitest run lib/rate-limit/fixed-window.test.ts`.
  2. Assert the 3rd request is blocked for `limit: 2`.
  3. Assert keys are isolated, the window resets, and `retry-after` is reported.
  4. Confirm both auth routes call `checkAuthRateLimit` with per-IP keys.
- **Expected outcome:** Limits hold per key/window and both endpoints are wrapped.
- **Validation points:** allowed/remaining/reset behaviour; 10 requests / 5 minutes configuration.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/04.log`, `13.log`
- **Actual:** PASS — 5/5 limiter tests pass; static check confirms `checkAuthRateLimit` in both auth routes with `session:`/`register:` keys. Shared-store limiting across instances remains a follow-up.
- **Status:** ✅ PASS

## TC-028 — Registration transaction

- **Requirement:** R-104
- **Preconditions:** Firebase project or Auth+Firestore emulators; a freshly created Firebase user and ID token.
- **Steps:**
  1. POST `/api/auth/register` with a valid bearer token and consents.
  2. Assert `users/{uid}` is created with `accountStatus: "active"`.
  3. Assert three granted `consentRecords`, an `emailLookup` entry and an `auditLogs` entry.
  4. Repeat the request; assert 200 `exists` and no duplicates.
  5. Register a second uid with the same email; assert 409 `email_in_use`.
- **Expected outcome:** Records are created atomically; retries are idempotent; duplicate emails are rejected.
- **Validation points:** transaction contents, idempotency, 409 collision, no partial writes.
- **Evidence:** _none — not executed_; static structure only in `13.log`
- **Actual:** NOT EXECUTED — requires a Firebase project or emulator (no project; JDK missing). Static check confirms `verifyIdToken`, `runTransaction` and `consentRecords` are wired, which is not a functional pass.
- **Status:** ⛔ BLOCKED — product-owner Firebase setup + JDK 21+ (`RFP.md` §4)

## TC-029 — Protected account route

- **Requirement:** R-105
- **Preconditions:** production server; no session cookie.
- **Steps:**
  1. `GET /account` with no cookie and `redirect: manual`.
  2. Assert 307 and `Location: /login`.
  3. Inspect the page: it calls `requireSessionUser()` (Admin `verifySessionCookie` with revocation check) behind Suspense.
- **Expected outcome:** Unauthenticated visitors never receive account HTML; verification is server-side.
- **Validation points:** HTTP status, redirect target, no client-only gate.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/06-route-smoke.json` (check `/account`)
- **Actual:** PASS — 307 to `/login` from the proxy; the page independently verifies the cookie with `verifySessionCookie(cookie, true)` before rendering account data.
- **Status:** ✅ PASS

## TC-030 — No browser token storage

- **Requirement:** R-102, R-106
- **Preconditions:** auth client and forms present.
- **Steps:**
  1. Scan `features/auth/client.ts` and the three auth forms for `localStorage`, `sessionStorage` and `document.cookie`.
  2. Assert no matches.
  3. Inspect IDs exchanged: ID token is posted once to `/api/auth/session` and never persisted.
- **Expected outcome:** No token is written to browser storage; the session lives only in the HttpOnly cookie.
- **Validation points:** static scan + code review of the exchange flow.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/13.log`
- **Actual:** PASS — 4/4 files clean; token held in a local variable for the exchange only. Firebase SDK persistence may keep its own refresh state in IndexedDB, which is not an app-managed token store; sessions are still server-authoritative.
- **Status:** ✅ PASS

## TC-031 — Auth utility unit coverage

- **Requirement:** R-107
- **Preconditions:** Vitest config aliases `@/` and mocks `server-only`.
- **Steps:**
  1. Run `npm test`.
  2. Confirm all test files and tests pass.
  3. Confirm the new suites cover rate limiting, origin, redirects, cookie options, hashing, request parsing and error copy.
- **Expected outcome:** 0 failed tests; auth utilities covered.
- **Validation points:** file/test counts, exit code, no skipped tests.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/04.log`
- **Actual:** PASS — 12 files, 72/72 tests in 2.44 s; exit 0. Phase 0 had 32 tests, so Phase 1A adds 40.
- **Status:** ✅ PASS

## TC-032 — End-to-end Firebase auth

- **Requirement:** R-108
- **Preconditions:** Firebase project configured in `.env.local` + Admin credentials, or Auth/Firestore emulators (JDK 21+).
- **Steps:**
  1. Create an account on `/signup`.
  2. Assert the session cookie is set and `/account` renders the signed-in email.
  3. Sign out; assert `/account` redirects to `/login`.
  4. Sign in again with the same credentials.
  5. Attempt signup with a birth date under 18 during onboarding (next slice) and assert rejection.
- **Expected outcome:** Full signup → session → account → sign-out → sign-in loop works against real Firebase.
- **Validation points:** cookie issuance, revocation check, account page data, redirects.
- **Evidence:** _none — not executed_
- **Actual:** NOT EXECUTED — no Firebase project (`.env.local` Firebase 0/6) and no emulator (Java missing). Login/signup buttons intentionally disable with a setup notice.
- **Status:** ⛔ BLOCKED — product-owner Firebase setup + JDK 21+ (`RFP.md` §4)

## TC-033 — Generic auth error copy

- **Requirement:** R-106
- **Preconditions:** error-mapping module.
- **Steps:**
  1. Run `npx vitest run features/auth/errors.test.ts`.
  2. Assert `auth/invalid-credential` maps to "Email or password is incorrect."
  3. Assert unknown codes fall back to a generic message.
  4. Inspect forgot-password: unknown emails also show the generic "if an account exists" confirmation.
- **Expected outcome:** No account enumeration; no raw Firebase codes shown to users.
- **Validation points:** mapped strings, fallback, single confirmation path.
- **Evidence:** `evidence/run-2026-10-28-phase1a-r2/04.log`
- **Actual:** PASS — 9/9 error-copy tests pass; forgot-password sets the same success state for unknown-email errors and only surfaces network/rate-limit failures.
- **Status:** ✅ PASS

## TC-034 — Onboarding page protection

- **Requirement:** R-109
- **Preconditions:** production build; no session cookie.
- **Steps:**
  1. `GET /onboarding` with `redirect: manual`.
  2. Assert 307 and `Location: /login` (proxy guard runs before render).
  3. Inspect the page: it also calls `requireSessionUser()` behind Suspense.
- **Expected outcome:** Unauthenticated visitors never receive onboarding HTML.
- **Validation points:** status, redirect target, defence in depth (proxy + page).
- **Evidence:** `evidence/run-2026-10-28-phase1b/06-route-smoke.json`
- **Actual:** PASS — 307 to `/login`; dev-server check matched (`/onboarding -> 307`).
- **Status:** ✅ PASS

## TC-035 — Onboarding validation rules

- **Requirement:** R-110, R-112
- **Preconditions:** `lib/validation/onboarding.ts` + Vitest.
- **Steps:**
  1. Run `npm test`.
  2. Assert under-18 and impossible birth dates are rejected.
  3. Assert interests need 3–8 allow-listed unique ids; languages 1–4 listed codes.
  4. Assert country must be `IN`; bios are capped at 300 and reject markup/control chars.
  5. Assert missing region/bio default safely.
- **Expected outcome:** All rules enforced in one shared schema used by client and server.
- **Validation points:** issue paths, defaults, no free-text region/country.
- **Evidence:** `evidence/run-2026-10-28-phase1b/04.log`
- **Actual:** PASS — 14 files, 84/84 tests; onboarding suite covers all five rule groups.
- **Status:** ✅ PASS

## TC-036 — Onboarding API guards

- **Requirement:** R-109, R-110
- **Preconditions:** production server; no Firebase required for the guard paths.
- **Steps:**
  1. `POST /api/onboarding` without an `Origin` header → expect 403 `forbidden_origin`.
  2. `POST /api/onboarding` with same-origin but no session cookie → expect 401 `unauthenticated`.
  3. Confirm the route derives the uid from `getSessionUser()`, never from the body.
- **Expected outcome:** CSRF and identity checks run before any write logic.
- **Validation points:** status codes, error codes, check order.
- **Evidence:** `evidence/run-2026-10-28-phase1b/06-route-smoke.json`; dev check `{"error":"unauthenticated"} HTTP 401`
- **Actual:** PASS — both guard responses captured; static check 14 confirms session-derived uid.
- **Status:** ✅ PASS

## TC-037 — Atomic onboarding save

- **Requirement:** R-111
- **Preconditions:** valid session + Firestore (project or emulator).
- **Steps:**
  1. Save a valid onboarding payload; assert `profiles/{uid}`, `preferences/{uid}`, `users/{uid}/private/ageAssurance` and an audit log are written.
  2. Re-save with a changed display name; assert `createdAt`, `photoCount` and `moderationStatus` are preserved.
  3. Kill the transaction mid-way (fault injection) and assert no partial writes.
- **Expected outcome:** Atomic, idempotent writes that never clobber existing state.
- **Validation points:** transaction contents, field preservation, audit action `profile.onboarding_completed`.
- **Evidence:** _none — not executed_; static structure in `14.log`
- **Actual:** NOT EXECUTED — requires Firebase session + Firestore. Static check confirms the transaction writes all four targets.
- **Status:** ⛔ BLOCKED — product-owner Firebase setup + JDK 21+ (`RFP.md` §4)

## TC-038 — Account reflects profile

- **Requirement:** R-113
- **Preconditions:** signed-in session with/without a saved profile.
- **Steps:**
  1. Sign in before onboarding; `/account` shows the "Complete profile" CTA.
  2. Complete onboarding; `/account` shows name, intent, broad region, languages and interest count.
  3. Click "Edit profile" → `/onboarding` prefills from the saved profile.
- **Expected outcome:** The account page mirrors onboarding state from the server, not client state.
- **Validation points:** server read via `getProfileSummary`, CTA vs summary branches.
- **Evidence:** _none — not executed_
- **Actual:** NOT EXECUTED — requires a working session (no Firebase project). Code path reviewed; summary rendering is guarded for missing fields.
- **Status:** ⛔ BLOCKED — product-owner Firebase setup (`RFP.md` §4)

## TC-039 — Onboarding end-to-end

- **Requirement:** R-114
- **Preconditions:** Firebase project or emulators (JDK 21+).
- **Steps:**
  1. Signup → session → `/onboarding`.
  2. Submit a valid profile; assert `/account` shows it.
  3. Submit an under-18 birth date; assert `403 underage` and no profile write.
- **Expected outcome:** Full signup → onboarding → account loop works against real Firebase.
- **Validation points:** underage rejection server-side, profile persistence, redirects.
- **Evidence:** _none — not executed_
- **Actual:** NOT EXECUTED — no Firebase project/emulator; not faked.
- **Status:** ⛔ BLOCKED — product-owner Firebase setup + JDK 21+ (`RFP.md` §4)

---

## Execution log

| Attempt | Date       | Runner   | Command                                                        | Result                                                                                                                   |
| ------- | ---------- | -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1       | 2026-10-27 | opencode | `npm run evidence`                                             | ❌ 11/12 — TC-023 regex matched the honest _denial_ ("no E2EE claim")                                                    |
| 2       | 2026-10-27 | opencode | `npm run evidence`                                             | ❌ 11/12 — format check included the generated evidence summary                                                          |
| 3       | 2026-10-27 | opencode | `npm run evidence`                                             | ✅ 12/12 · 44.5 s · capture in `evidence/phase0-2026-10-27/`                                                             |
| 4       | 2026-10-28 | opencode | `npm run evidence`                                             | ✅ 12/12 · 207.1 s · re-verification in `evidence/run-2026-10-28/`                                                       |
| 5       | 2026-10-28 | opencode | `npm run evidence -- --out evidence/run-2026-10-28-phase1a`    | ❌ 12/13 — same-origin API check compared against `request.url` (normalised to `localhost`) instead of the `Host` header |
| 6       | 2026-10-28 | opencode | `npm run evidence -- --out evidence/run-2026-10-28-phase1a-r2` | ✅ 13/13 · 120.5 s · Phase 1A capture                                                                                    |
| 7       | 2026-10-28 | opencode | `npm run evidence -- --out evidence/run-2026-10-28-phase1b`    | ✅ 14/14 · Phase 1B capture                                                                                              |

> Attempts 1 and 2 failed for **tooling** reasons, not product defects: the E2EE check was over-broad and generated evidence is now excluded from Prettier. Both were fixed and the full suite re-executed. Run 3 is the Phase 0 capture; run 4 re-verifies the same code the next day. The evidence script now names each run by date automatically.
>
> Attempt 5 exposed a real CSRF-check bug: `request.url` is normalised to `localhost`, so a same-origin request to `127.0.0.1` was rejected. `requestOrigin()` now derives the origin from the `Host` header (honouring `x-forwarded-proto`), and run 6 re-executed every gate. Attempt 5's failed artifacts are kept in `evidence/run-2026-10-28-phase1a/`.
>
> TC-021, TC-022, TC-028, TC-032, TC-037, TC-038 and TC-039 stay BLOCKED until the human actions in `RFP.md` §4 are completed. They must not be reported as passed.
