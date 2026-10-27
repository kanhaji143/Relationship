# Bondora (working name)

Privacy-first, consent-led, **adults-only (18+)** relationship platform. India-first, responsive web MVP, hosted on Firebase.

> ⚠️ **Provisional brand.** "Bondora" is a working label only — trademark/domain/company-name checks are pending. Branding is configurable via `NEXT_PUBLIC_BRAND_NAME`. Do not launch publicly under this name before clearance.

## Status

**Phase 0 — complete** (2026-10-27). Next: **Phase 1 — Foundations** (accounts, age assurance, onboarding).

| Phase                    | Status                                            |
| ------------------------ | ------------------------------------------------- |
| 0 — Discovery & setup    | ✅ App boots, tooling green, docs + rules drafted |
| 1 — Foundations          | ⏳ Next                                           |
| 2 — Discovery & matching | —                                                 |
| 3 — Chat & safety        | —                                                 |
| 4 — Privacy & billing    | —                                                 |
| 5 — Launch readiness     | —                                                 |

## Quick start

```bash
npm install
npm run setup:env     # creates .env.local from .env.example (safe: never overwrites)
npm run dev           # http://localhost:3000
```

The app boots **without** Firebase. Auth and data features turn on after the one-time, human-only setup in [`docs/SETUP_FIREBASE.md`](docs/SETUP_FIREBASE.md).

```bash
npm run env:check     # which env keys are missing (names only, never values)
npm run emulators     # Firebase Emulator Suite (needs JDK 21+)
npm run rules:deploy  # deploy firestore.rules + storage.rules to the linked project
```

## Scripts

| Script                            | What it does                                   |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Next.js dev server                             |
| `npm run build` / `start`         | Production build / serve                       |
| `npm run lint`                    | ESLint (Next core-web-vitals + TypeScript)     |
| `npm run format`                  | Prettier write (Tailwind class sorting)        |
| `npm run typecheck`               | `tsc --noEmit`                                 |
| `npm test` / `test:watch`         | Vitest unit tests                              |
| `npm run verify`                  | format:check → lint → typecheck → test → build |
| `npm run setup:env` / `env:check` | Local env bootstrap / validation               |
| `npm run emulators`               | Firebase emulators (Auth/Firestore/Storage)    |
| `npm run rules:deploy`            | Deploy security rules                          |

## What is in this repo

| Path          | Purpose                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Next.js App Router pages — marketing now; auth, onboarding, discovery, matches, chat, settings, admin in later phases |
| `components/` | Reusable accessible UI (Tailwind v4 + TypeScript)                                                                     |
| `features/`   | Domain modules: auth, profiles, discovery, matches, messaging, safety, privacy, billing, admin                        |
| `functions/`  | **All sensitive business logic lives here** (Cloud Functions + Firebase Admin SDK)                                    |
| `firestore/`  | Seed data, schema docs                                                                                                |
| `lib/`        | Config (brand/env), Firebase client/admin wrappers, validation, logging, collections                                  |
| `types/`      | Domain + Firestore document types                                                                                     |
| `scripts/`    | Local tooling (env bootstrap/check)                                                                                   |
| `tests/`      | Test helpers and (Phase 5) e2e                                                                                        |
| `docs/`       | Blueprint, architecture, setup, schema, legal checklist, decisions, phase tracker                                     |

## Security architecture (non-negotiable)

**The browser never talks to Firestore or Storage directly.** Security rules deny all direct client access; every read/write goes through an authorized Cloud Function or Next.js server route. Authorization (ownership, match participant, block-awareness) is enforced server-side. Never trust a user ID, role, price, or permission supplied by the browser.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and decisions #3 in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Product rules

- Adults only (18+); age assurance on onboarding; minors blocked.
- Two explicit intents: serious dating / consensual casual dating — never misrepresented.
- Safety features (report, block, safety center, account deletion) are **never paywalled**.
- No fake engagement, no dark patterns, no precise-location tracking, no covert monitoring.
- Payments stay in test mode until credentials + legal review are complete.
- Seed data is clearly fictional only.

## Environment

Copy `.env.example` → `.env.local`. Public values are inlined at build time (`NEXT_PUBLIC_*`); secrets never leave the server.

| Key group                                       | Required for                             |
| ----------------------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_APP_URL` | App boot (defaults exist)                |
| `NEXT_PUBLIC_FIREBASE_*`                        | Auth + client SDK wiring                 |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`             | Admin SDK locally (ADC in production)    |
| `RAZORPAY_*`, `BILLING_TEST_MODE`               | Phase 4 billing (leave empty = disabled) |

## Verification (Phase 0 exit)

```
npm run verify
✔ format:check   ✔ lint   ✔ typecheck
✔ vitest         32 tests passing
✔ next build     4 static routes
```

Rule deployment and emulator runs need a Firebase project and JDK 21+ — see [`docs/SETUP_FIREBASE.md`](docs/SETUP_FIREBASE.md). Nothing in this repo has been deployed publicly.

## Key documents

- [`docs/PRODUCT_BLUEPRINT.md`](docs/PRODUCT_BLUEPRINT.md) — full product specification (source of truth)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Firebase architecture + data-flow rules
- [`docs/FIRESTORE_SCHEMA.md`](docs/FIRESTORE_SCHEMA.md) — collections and relationships
- [`docs/SETUP_FIREBASE.md`](docs/SETUP_FIREBASE.md) — one-time Firebase setup walkthrough
- [`docs/LEGAL_CHECKLIST_INDIA.md`](docs/LEGAL_CHECKLIST_INDIA.md) — mandatory Indian-law anchors before launch
- [`docs/PHASES.md`](docs/PHASES.md) — phase scope + exit criteria
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — append-only decision log

## Legal note

This codebase implements safety/privacy features, but **launch requires qualified legal counsel review** for India (DPDP Act 2023 + DPDP Rules, IT Act/IT Rules intermediary duties, consumer/e-commerce and payment rules) using the checklist in `docs/LEGAL_CHECKLIST_INDIA.md`.
