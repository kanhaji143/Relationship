# Phase Tracker (Firebase edition)

Source: docs/PRODUCT_BLUEPRINT.md §12/§14 — adapted per docs/DECISIONS.md.

Current status: **Phase 0 in progress.**
Rule: each phase keeps the app runnable before the next begins.

| Phase | Scope | Exit criteria | Status |
|---|---|---|---|
| **0 — Discovery & setup** | Repo skeleton ✅ • docs (blueprint, architecture, schema, legal checklist, decisions) ✅ • rules drafts ✅ • Next: Firebase project walkthrough, `npx create-next-app` scaffold wiring, env wiring, Firestore schema skeleton for auth phase, lint/format/test tooling | App boots locally with brand config; rules deploy cleanly; links to blueprints live | 🟡 In progress |
| **1 — Foundations** | Responsive shell + UI kit • Next.js + Firebase Auth integration with HttpOnly cookie sessions • onboarding (display name, birth date/age gate, country/region, languages, intent, preferences, interests, prompts, photo upload pipeline) • profiles/preferences Writes via Functions • validation, rate limits, audit for auth events | signup→login→onboarding end-to-end; underage blocked; authorization + auth tests pass |
| **2 — Discovery & matching** | Candidate pool computation • /discover (like/pass, intent badges, filters, empty state) • /likes • /matches • block-aware exclusions • self/dupe-like prevention | No blocked pair ever recommended; match tests pass |
| **3 — Chat & safety** | Realtime conversations (participants only) • messages + moderation hooks • report/block/unmatch • /admin console: queue, triage, appeals, audit logs, role-based staff access (MFA) | Participant-only access enforced; report lifecycle tested; audit trails verified |
| **4 — Privacy & billing** | Privacy center: pause/hide, visibility, notification privacy, export/delete workflows • plans page (transparent terms) • Razorpay adapter (test mode): checkout, webhook signature verify, idempotency, cancellation | Export/deletion tested; billing test-mode only; plan terms visible pre-checkout |
| **5 — Launch readiness (private beta)** | Monitoring/observability • accessibility review • e2e suite • threat model update • docs/LEGAL_CHECKLIST_INDIA.md sign-off • moderation staffing plan • incident drill | Blueprint §13 MVP acceptance checklist green; counsel sign-off; launch gate PASSED |

## Standing constraints (from blueprint §MASTER rules)

- Phased, runnable after each phase.
- Lint, typecheck, tests, build run before "done" claims; results reported honestly.
- No fake integrations — adapters + safe test modes (billing/email/photo-moderation now).
- Seed data fictional only.
- Blueprint-excluded features (dark patterns, fake engagement, paid safety access, precise-location tracking) explicitly EXCLUDED.
