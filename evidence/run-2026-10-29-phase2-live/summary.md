# Phase 2 live Firebase verification (approved)

- Date: 2026-10-29
- Project: `apna-computer-ltd` (linked project, owner-approved controlled test writes)
- Local app: `http://127.0.0.1:3002` (production build)
- Command: `node --env-file-if-exists=.env.local scripts/run-phase2-live-validation.mjs --confirm-live-writes`
- Result: TC-052 PASS
- Scope: two disposable synthetic Auth users (`bondora-phase2-*@example.com`) with fictional fixtures; Auth users, profiles, preferences, private age docs, likes, block, match and conversation were deleted afterwards. Two append-only `auditLogs` rows (`discover.like`) remain by design.
- Not changed: billing, Firestore/Storage rules, Storage access settings, indexes, or any real user record.

## Captured output

- `01-live-e2e.log` — guarded live run: session exchange, candidate privacy, block exclusion, mutual like → match/conversation/audit, idempotent retry, cleanup counters
- `02-cleanup-verification.log` — independent read-only re-check: 0 residual synthetic Auth users, 0 residual synthetic profiles, 2 sampled like-audit rows with no PII fields
- `03-quality-gates.log` — `format:check`, `lint`, `typecheck` and 142/142 unit tests after the change

## Verified scenarios

1. Live Firebase ID tokens were exchanged for HttpOnly `__session` cookies through `/api/auth/session`.
2. `/api/discover/candidates` returned the synthetic partner without exact birth date or private age fields.
3. A two-way block removed the partner from the feed and rejected the like with HTTP 404.
4. Reciprocal likes created one canonical match, one conversation and two audit events; the duplicate retry returned `already_recorded`.
5. Cleanup deleted both Auth users and every fixture; retained audit rows contain only UID/target/metadata fields (no email, display name or tokens).
