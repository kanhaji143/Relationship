# Test Cases — Phase 0 baseline

**Generated from:** `RFP.md` §2 (owner input space §1 was empty at generation time)
**Executed:** 2026-10-27 · run `evidence/phase0-2026-10-27/`
**Re-verified:** 2026-10-28 · run `evidence/run-2026-10-28/`
**Result:** **21/21 executable cases passed · 2 blocked · 0 failed** (23 total)
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
| Git at run time  | `master@f3df165`                         |

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

---

## Execution log

| Attempt | Date       | Runner   | Command            | Result                                                                |
| ------- | ---------- | -------- | ------------------ | --------------------------------------------------------------------- |
| 1       | 2026-10-27 | opencode | `npm run evidence` | ❌ 11/12 — TC-023 regex matched the honest _denial_ ("no E2EE claim") |
| 2       | 2026-10-27 | opencode | `npm run evidence` | ❌ 11/12 — format check included the generated evidence summary       |
| 3       | 2026-10-27 | opencode | `npm run evidence` | ✅ 12/12 · 44.5 s · capture in `evidence/phase0-2026-10-27/`          |
| 4       | 2026-10-28 | opencode | `npm run evidence` | ✅ 12/12 · 207.1 s · re-verification in `evidence/run-2026-10-28/`    |

> Attempts 1 and 2 failed for **tooling** reasons, not product defects: the E2EE check was over-broad and generated evidence is now excluded from Prettier. Both were fixed and the full suite re-executed. Run 3 is the Phase 0 capture; run 4 re-verifies the same code the next day. The evidence script now names each run by date automatically.
>
> TC-021 and TC-022 stay BLOCKED until the human actions in `RFP.md` §3 are completed. They must not be reported as passed.
