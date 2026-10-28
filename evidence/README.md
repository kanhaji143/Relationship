# Evidence

Execution proof for `TestCases.md`. One folder per run; every folder has a `summary.md` (human-readable) and `summary.json` (machine-readable), plus raw logs.

## Runs

| Run | Date | Scope | Result |
|---|---|---|---|
| [`phase0-2026-10-27/`](phase0-2026-10-27/summary.md) | 2026-10-27 | Phase 0 baseline (RFP §2) | ✅ 12/12 checks passed · 44.5 s · commit `f3df165` |
| [`run-2026-10-28/`](run-2026-10-28/summary.md) | 2026-10-28 | Phase 0 re-run (RFP §2) | ✅ 12/12 checks passed · 207.1 s · commit `5d23cb1` |
| [`run-2026-10-28-phase1a/`](run-2026-10-28-phase1a/summary.md) | 2026-10-28 | Phase 1A first attempt (RFP §3) | ❌ 12/13 — same-origin API check bug (fixed); kept as failure evidence |
| [`run-2026-10-28-phase1a-r2/`](run-2026-10-28-phase1a-r2/summary.md) | 2026-10-28 | Phase 1A verified (RFP §3) | ✅ 13/13 checks passed · 120.5 s · base commit `d8269b4` |

## Artifacts in the current run

Latest run: [`run-2026-10-28-phase1a-r2/`](run-2026-10-28-phase1a-r2/). File names below are identical in every run folder.

| File | What it proves |
|---|---|
| `01.log` | Prettier format gate |
| `02.log` | ESLint gate |
| `03.log` | TypeScript gate |
| `04.log` | 72 unit tests (age gate, consent, email, match ID, logging, env, brand, rate limit, origin, cookies, hashing, error copy) |
| `05.log` | Production build + route list (10 routes, proxy) |
| `06-route-smoke.log` / `.json` | Page statuses (200/307/404), redirect target, and auth API guards (403 CSRF, 503 unconfigured, cookie clear) |
| `07.log` | Env bootstrap/check output (key names only) |
| `08.log` | Firestore + Storage deny-all static assertions |
| `09.log` | Secret hygiene (gitignore + tracked-file scan) |
| `10.log` | Docs presence, link resolution, CI parity |
| `11.log` | Accessibility markers + honest-claim check |
| `12.log` | Firebase client/admin/emulator wiring |
| `13.log` | Auth session hardening (HttpOnly cookie, origin+rate-limit wiring, transaction, no browser token storage) |
| `summary.md` / `summary.json` | Totals, timings, environment, git commit |

## Not covered here (blocked)

| Case | Reason |
|---|---|
| TC-021 — rules deployment | No Firebase project exists yet; `.firebaserc` still has the placeholder id |
| TC-022 — emulator suite | `java -version` fails on this machine; JDK 21+ required |
| TC-028 — registration transaction | Needs Auth token + Firestore (project or emulator) |
| TC-032 — end-to-end Firebase auth | Needs a Firebase project or emulator; not faked |

## How to reproduce

```bash
npm install
npm run setup:env      # only creates .env.local when missing
npm run evidence       # gates + route smoke + static checks
```

Evidence rules:

- Logs are raw command output; failures are kept, not trimmed away.
- A test is never marked PASS without a captured log or JSON artifact.
- Blocked cases are recorded as BLOCKED with the reason.
- Never commit `.env.local`, service-account keys or user data to this folder.
