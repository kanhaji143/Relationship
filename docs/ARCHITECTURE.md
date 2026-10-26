# Architecture — Firebase Edition

Adapted from `docs/PRODUCT_BLUEPRINT.md` (source of truth), replacing the PostgreSQL/Prisma default with Firebase per product owner decision.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Hosting | Firebase App Hosting (SSR-capable; Asia region) |
| Auth | Firebase Authentication (email/password now; phone/MFA-ready). Session via Secure, HttpOnly, SameSite cookies managed server-side |
| Database | Cloud Firestore |
| Sensitive logic | Cloud Functions (TypeScript) + Firebase Admin SDK |
| Media | Cloud Storage for Firebase — private bucket, short-lived signed download URLs, type/size validation, EXIF strip pipeline hook |
| Realtime chat | Firestore realtime listeners (participant-authorized reads via Functions-issued tokens/design) |
| Bot/abuse signals | Firebase App Check + rate limiting in Functions |
| Payments | Razorpay adapter in Functions (test mode until credentials + legal review; webhook signature verification + idempotency mandatory) |
| Email | Adapter interface; local/test mode logs payloads until a provider is chosen |

## The one rule above all others

> **The browser never talks to Firestore/Storage directly.**
> Firestore security rules deny all client reads/writes. Every sensitive operation runs in a Cloud Function or a Next.js server route that:
> 1. verifies the authenticated user, 2. enforces ownership / match-participant / block relations, 3. validates input schemas, and 4. rate-limits.

Why: Firestore rules cannot express block-aware discovery, canonical match pairs, moderation states, or audit requirements. Server-enforced logic (per blueprint rule 6) is the only safe design.

## Firestore consequence: candidate pools

SQL-style multi-field filtering (intent + age window + region + block list + visibility) is not a single Firestore query. Design:

- On profile/preferences change, a background job (Functions) recomputes the user's **candidate pool** into a per-user subcollection of eligible profile summaries.
- Discovery reads the pool, then ranks (compatibility/interests/values/freshness weighting — transparent, no sensitive inference).
- Hard exclusions re-checked at serve time: account status, blocks (both directions), pause/hide, adult eligibility.

## Data flow (sensitive actions)

```text
Browser ──(HTTPS, session cookie / ID token + App Check)──▶ Next.js server route or HTTPS Function
              │  validate • authorize • rate-limit • audit
              ▼
        Firestore / Cloud Storage (Admin SDK writes only)
              │
              ▼
        Audit trail (restricted metadata) + safe email/notification adapters
```

## Security controls (from blueprint section 8)

- Passwords: Firebase Auth maintained hashing; no reversible storage anywhere.
- Sessions: Secure/HttpOnly/SameSite cookies; rotate on privilege change; revoke on password change/compromise.
- Authorization: server-side on every profile, conversation, message, photo, and request.
- Rate limits: signup, login, likes, messages, uploads, report submission.
- Media: private bucket, signed short-lived URLs, size/type checks, EXIF stripping, moderation status; malware scan hook documented (vendor pending).
- Logging: never log passwords, tokens, full payment data, message content, or sensitive profile text.
- Chat encryption posture: **no E2EE claim in MVP.** TLS in transit + platform-side access restriction + staff access limited/justified/audited. Disclose honestly in privacy notice.

## Deployment topologies

- Dev: local emulators (Firebase Emulator Suite: Auth/Firestore/Storage/Functions) — default for development.
- Prod: Firebase App Hosting + regional Firestore (asia-south1 Mumbai preferred, data-residency note in privacy notice).

## Future mobile app

API-first: the same HTTPS Functions serve a future React Native client. Web-first per blueprint.
