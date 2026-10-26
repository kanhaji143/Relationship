# Relationship Platform (working name: Bondora)

Privacy-first, consent-led, **adults-only (18+)** relationship platform. India-first, responsive web MVP, hosted on Firebase.

> ⚠️ **Provisional brand.** "Bondora" is a working label only — trademark/domain/company-name checks are pending. Branding is configurable via `NEXT_PUBLIC_BRAND_NAME`. Do not launch publicly under this name before clearance.

## Status

Phase 0 — scaffolding (see `docs/` for the full plan and legal checklist).

## What is in this repo

| Path | Purpose |
|---|---|
| `app/` | Next.js (App Router) pages — marketing, auth, onboarding, discovery, matches, chat, settings, admin |
| `components/` | Reusable accessible UI (Tailwind + TypeScript) |
| `features/` | Domain modules: auth, profiles, discovery, matches, messaging, safety, privacy, billing, admin |
| `functions/` | **All sensitive business logic lives here** (Cloud Functions + Firebase Admin SDK) |
| `firestore/` | Security rules, indexes, schema docs, fictional seed data |
| `lib/` | Firebase client/admin wrappers, session, validation, logging, rate limiting |
| `docs/` | Blueprint, architecture, India legal checklist, Firestore schema, decision log |
| `tests/` | Integration and e2e tests |

## Critical architecture rule

**The browser never talks to Firestore directly.** Firestore security rules deny all direct client access; every read/write goes through authorized Cloud Functions or Next.js server routes. All authorization (ownership, match-participant, block-awareness) is enforced server-side. Never trust a user ID, role, price, or permission supplied by the browser.

## Non-negotiable product rules

- Adults only (18+). Age assurance on onboarding; minors are blocked.
- Two explicit relationship intents: serious dating / consensual casual dating — never misrepresent intent.
- Safety features (report, block, safety center, account deletion) are **never paywalled**.
- No fake engagement, no dark patterns, no precise-location tracking, no covert monitoring.
- Payments stay in test mode until credentials + legal review are complete.
- Seed data is clearly fictional only. Never put real user data or ID documents in dev environments.

## Setup (Phase 0 — being completed)

1. Prerequisites: Node.js 20+, npm 11+, a Firebase project (Firebase console), Firebase CLI (`npm i -g firebase-tools`).
2. `cp .env.example .env.local` and fill Firebase web config values.
3. `npm install` then `npm run dev` (commands activated as phases land).
4. Deploy rules: `firebase deploy --only firestore:rules,storage`.
5. Full details: `docs/ARCHITECTURE.md`.

## Key documents

- `docs/PRODUCT_BLUEPRINT.md` — full product specification (source of truth)
- `docs/ARCHITECTURE.md` — Firebase architecture + data-flow rules
- `docs/FIRESTORE_SCHEMA.md` — collections and relationships
- `docs/LEGAL_CHECKLIST_INDIA.md` — mandatory Indian-law anchors before launch
- `docs/DECISIONS.md` — decision log (append-only)

## Legal note

This codebase implements safety/privacy features, but **launch requires qualified legal counsel review** for India (DPDP Act 2023 + DPDP Rules, IT Act/IT Rules intermediary duties, consumer/e-commerce and payment rules) using the checklist in `docs/LEGAL_CHECKLIST_INDIA.md`.
