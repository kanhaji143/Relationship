# Firebase Setup (Phase 0 → Phase 1)

One-time human steps. Everything in the repo is ready; the items below need a Google account with access to the Firebase console.

> The app boots **without** Firebase. Auth and data features turn on only after this setup.

---

## 0. Prerequisites

| Tool         | Version                     | Notes                                                         |
| ------------ | --------------------------- | ------------------------------------------------------------- |
| Node.js      | 20.19+ (22 LTS recommended) | `node -v`                                                     |
| npm          | 11+                         | ships with Node                                               |
| Firebase CLI | latest                      | `npm i -g firebase-tools` (already available on this machine) |
| Java         | JDK 21+                     | **only** needed for the Firestore/Storage emulators           |

## 1. Create the Firebase project

1. Open <https://console.firebase.google.com> → **Add project**.
2. Project name: `bondora-dev` (or your own). Note the **project ID**.
3. Google Analytics: optional, can be disabled for dev.
4. After creation, open **Project settings → General → Your apps → Web (`</>`)**.
5. Register app nickname `bondora-web`. Do **not** enable Hosting yet.
6. Copy the `firebaseConfig` values into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

7. Verify: `npm run env:check`.

> Firestore region: choose **asia-south1 (Mumbai)** when you create the database. This is a permanent choice. Document the data-residency statement in the privacy notice (see `docs/LEGAL_CHECKLIST_INDIA.md`).

## 2. Create Firestore + Storage

1. **Build → Firestore Database → Create database**.
   - Mode: **Production mode** (rules are already deny-all in this repo).
   - Location: `asia-south1`.
2. **Build → Storage → Get started** → same region, production mode.
3. Do not add collections by hand. Schema lives in `docs/FIRESTORE_SCHEMA.md`; server code creates documents.

## 3. Enable Authentication

1. **Build → Authentication → Get started**.
2. **Sign-in method → Email/Password → Enable** (no email-link sign-in for MVP).
3. **Settings → Authorized domains**: `localhost` is pre-approved; add the App Hosting domain later.
4. Keep **Email enumeration protection** enabled (default).

> **Session cookies need Admin credentials.** `/login` and `/signup` use the client SDK, then `POST /api/auth/session` exchanges the ID token for an HttpOnly cookie using the Admin SDK. Complete §7 (ADC or service-account path) or the route returns `503 auth_not_configured`.

## 4. Link the CLI to the project

```bash
firebase login
firebase use --add          # select the project, alias it "default"
```

`.firebaserc` currently contains the placeholder `YOUR_FIREBASE_PROJECT_ID`; `firebase use --add` replaces it.

## 5. Deploy security rules

```bash
npm run rules:deploy
```

Expected result: both `firestore.rules` and `storage.rules` deploy with the deny-all posture. Confirm in the console under **Rules**.

If the CLI complains about Storage, verify the bucket exists (step 2).

## 6. Local development with emulators

The emulator suite is the default dev topology (`docs/ARCHITECTURE.md`).

1. Install Java (JDK 21+) if `java -version` fails.
2. Install emulator binaries once: `firebase setup:emulators:firestore`
3. Start: `npm run emulators`
   - UI: <http://localhost:4000>
   - Auth `:9099` · Firestore `:8080` · Storage `:9199`
4. Keep `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local` (default) and `npm run dev` in a second terminal.
5. The Admin SDK automatically talks to the emulators when `FIRESTORE_EMULATOR_HOST` etc. are set by the emulator process. For scripts run outside the emulator shell, export:

   ```powershell
   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
   $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
   $env:FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"
   $env:GCLOUD_PROJECT="demo-bondora"
   ```

### Without Java

You can still run `npm run dev` and use the static shell. Auth/data work requires the emulator; do not point local dev at a production Firebase project with real data.

## 7. Server credentials (Admin SDK)

| Environment                            | Credential                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Emulator                               | none (project ID `demo-bondora`)                                                                                         |
| Local against a real project           | `gcloud auth application-default login` **or** `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json` (gitignored) |
| Firebase App Hosting / Cloud Functions | Application Default Credentials (automatic)                                                                              |

Never commit a service account key. `.gitignore` already blocks `*firebase-adminsdk*.json` and `serviceAccountKey*.json`.

## 8. Cost and safety guardrails

- Billing is only needed for App Hosting and Cloud Functions. Keep Blaze plan limits/alerts low during development.
- Enable **App Check** (reCAPTCHA Enterprise for web) before any public beta — Phase 5.
- Set a Firestore budget alert and keep daily read/write quotas in mind for seeded data.
- Seed data must stay fictional (`firestore/seed/`).

## 9. App Hosting (Phase 5, not now)

Firebase App Hosting connects a GitHub repo and builds with Next.js SSR. Do not create the backend until the app has deployable phases and the legal checklist has sign-off.

---

## Troubleshooting

| Symptom                               | Fix                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `Firebase is not configured`          | `.env.local` missing values; restart `npm run dev` (public env is read at startup). |
| `Missing or insufficient permissions` | Rules are deny-all by design. Reads/writes must go through server code.             |
| Emulator fails to start               | Install JDK 21+; make sure ports 4000/8080/9099/9199 are free.                      |
| `auth/unauthorized-domain`            | Add the current host to Auth → Settings → Authorized domains.                       |
| `auth_not_configured` (503)           | Either the web config (§1) is missing or Admin credentials (§7) are unavailable.    |
| `auth_unavailable` (503)              | Admin SDK could not reach Firebase; check ADC/service-account path and network.     |
| CLI deploys to the wrong project      | `firebase use` and re-check `.firebaserc`.                                          |
