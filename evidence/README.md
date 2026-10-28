# Evidence

Execution proof for `TestCases.md`. One folder per run; every folder has a `summary.md` (human-readable) and `summary.json` (machine-readable), plus raw logs.

## Runs

| Run | Date | Scope | Result |
|---|---|---|---|
| [`phase0-2026-10-27/`](phase0-2026-10-27/summary.md) | 2026-10-27 | Phase 0 baseline (RFP §2) | ✅ 12/12 checks passed · 44.5 s · commit `f3df165` |
| [`run-2026-10-28/`](run-2026-10-28/summary.md) | 2026-10-28 | Phase 0 re-run (RFP §2) | ✅ 12/12 checks passed · 207.1 s · commit `5d23cb1` |
| [`run-2026-10-28-phase1a/`](run-2026-10-28-phase1a/summary.md) | 2026-10-28 | Phase 1A first attempt (RFP §3) | ❌ 12/13 — same-origin API check bug (fixed); kept as failure evidence |
| [`run-2026-10-28-phase1a-r2/`](run-2026-10-28-phase1a-r2/summary.md) | 2026-10-28 | Phase 1A verified (RFP §3) | ✅ 13/13 checks passed · 120.5 s · commit `967d0d9` |
| [`run-2026-10-28-phase1b/`](run-2026-10-28-phase1b/summary.md) | 2026-10-28 | Phase 1B onboarding verified (RFP §3.1) | ✅ 14/14 checks passed · 62.5 s · commit `967d0d9` |
| [`run-2026-10-28-firebase-live/`](run-2026-10-28-firebase-live/summary.md) | 2026-10-28 | Real Firebase auth + onboarding + rules deploy | ✅ 15/15 checks · plus 7/7 browser E2E checks · exact code revision is in `summary.md` |
| [`run-2026-10-28-phase1c/`](run-2026-10-28-phase1c/summary.md) | 2026-10-28 | Profile prompts + discovery preferences | ✅ 16/16 automated · 9 browser checks pass, 1 photo check blocked |

## Artifacts in the current run

Latest run: [`run-2026-10-28-phase1c/`](run-2026-10-28-phase1c/). File names below are identical in every run folder.

| File | What it proves |
|---|---|
| `01.log` | Prettier format gate |
| `02.log` | ESLint gate |
| `03.log` | TypeScript gate |
| `04.log` | 95 unit tests, including prompt and discovery validation |
| `05.log` | Production build + route list (16 routes, proxy) |
| `06-route-smoke.log` / `.json` | Page statuses/redirects and API auth/CSRF guards, including new settings routes |
| `07.log` | Env check (key names only; Firebase client config 6/6 present) |
| `08.log` | Firestore + Storage deny-all static assertions |
| `09.log` | Secret hygiene (gitignore + tracked-file scan) |
| `10.log` | Docs presence, link resolution, CI parity |
| `11.log` | Accessibility markers + honest-claim check |
| `12.log` | Firebase client/admin/emulator wiring |
| `13.log` | Auth session hardening |
| `14.log` | Onboarding guardrails (18+ schema, session-derived uid, atomic transaction, allow-lists) |
| `15.log` | Static prompt/preferences hardening checks |
| `16.log` | Read-only Firebase Auth/Firestore user verification; PII omitted |
| `15-browser-e2e.json` | Ten browser outcomes for auth, onboarding, prompts, preferences and validation; test identity omitted |
| `16-storage-prerequisite.log` | Read-only bucket privacy/signing probe; explains the photo upload block |
| `summary.md` / `summary.json` | Totals, timings, environment, git commit |

## Not covered here (blocked)

| Case | Reason |
|---|---|
| TC-022 — emulator suite | `java -version` fails on this machine; JDK 21+ required |
| TC-045 — photo storage | Bucket exists, but uniform bucket access/public-access prevention/server signing are not ready; owner must approve/configure them |

## How to reproduce

```bash
npm install
npm run setup:env      # only creates .env.local when missing
npm run evidence       # gates + route smoke + static checks
```

For an authenticated Firebase data check, set `FIREBASE_E2E_UID` to a dedicated test account UID and run `npm run evidence`. The verifier prints only pass/fail fields; it never prints UID, email, DOB or tokens.

Evidence rules:

- Logs are raw command output; failures are kept, not trimmed away.
- A test is never marked PASS without a captured log or JSON artifact.
- Blocked cases are recorded as BLOCKED with the reason.
- Never commit `.env.local`, service-account keys or user data to this folder.
