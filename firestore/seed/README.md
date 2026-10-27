# Seed data (fictional only)

Rules:

1. **Every record here is fictional.** No real names, emails, phone numbers, photos or ID documents — ever. Dev/test environments must never contain real user data.
2. Seed IDs should be deterministic (`demo-user-001`) so bugs are reproducible.
3. Keep seed data minimal: enough profiles, intents, blocks and reports to exercise the current phase's flows.
4. Import into the **emulator only** (`demo-bondora` project). Never import into a real Firebase project.

The import script lands in Phase 1, together with the first collections (`users`, `profiles`, `preferences`, `consentRecords`).
