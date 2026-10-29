# Phase 3 chat & safety slice (emulator-verified)

- Date: 2026-10-29
- Project: `demo-bondora` (Firestore emulator at `127.0.0.1:8080`)
- Scope: participant-only conversations, text messages, conversation list, unmatch, block/unblock
- Result: TC-053, TC-054, TC-055, TC-056, TC-059, TC-060 PASS
- Not in this slice: report intake/moderation queue (R-306) and admin roles (R-307)

## Captured output

- `01-unit-tests.log` — 39 focused tests across chat authorization, message validation, block ids, send route, unmatch route and block/unblock routes
- `02-emulator-e2e.log` — 4/4 route-to-Firestore emulator tests: send/read, list preview, non-participant denial, unmatch, block
- `03-route-smoke.log` — production server: `/messages` and `/messages/:id` 307 to `/login`, API 401, home 200
- `04-quality-gates.log` — format, lint, typecheck and 181/181 unit tests

## Verified scenarios

1. A matched participant can send a trimmed text message; the conversation timestamp/preview updates and the thread is readable only by the two participants.
2. A non-participant gets 404 for both read and send, so thread existence is not disclosed.
3. Unmatch sets the match to `unmatched`, closes the conversation, writes an audit row, is idempotent, and later sends return 409.
4. A one-way block is deterministic/idempotent, closes the match and chat, sends return 403, and unblock removes the row with an audit event.
5. The production build renders `/messages` behind the proxy guard; no linked-project data or settings were touched.
