# Firestore Data Model (schema + relationships)

Blueprint's relational model (section 5) adapted to Firestore. Rules followed: UUID-style IDs, UTC timestamps, unique pairs enforced in transactions, canonical match pair, no destructive deletes without retention policy, audit records preserved.

## Primary collections (top-level)

| Collection | Key fields | Notes |
|---|---|---|
| `users/{uid}` | email(normalized, unique via lookup), accountStatus, emailVerifiedAt, authProviderRefs, createdAt/updatedAt, lastLoginAt | Never store plaintext passwords. Auth credentials live in Firebase Auth only. |
| `users/{uid}/private/{doc}` | birthDate (exact DOB), phone verification refs, minimal age-assurance result, consent snapshots | Subcollections stay out of casual queries; exact DOB is private-only. |
| `profiles/{uid}` (doc id = uid) | displayName, minimized age only (exact DOB null), bio, countryCode, regionCode, broadLocationLabel, languages, visibility, moderationStatus, photoCount | Public fields only here; no exact DOB, contact or private data. |
| `profilePhotos/{photoId}` | uid, storagePath (private), sortOrder, moderationStatus, deletedAt | Signed URLs issued server-side, short-lived; EXIF stripped at upload pipeline. |
| `preferences/{uid}` | intent enum(s), desiredIntents[], ageMin/Max, distanceLimit(optional), preferredRegions, languages, dealbreakers, discoveryPaused | |
| `interests/{interestId}` | name, category, active | Each profile stores interest IDs on its own doc. |
| `prompts/{promptId}` | uid, promptKey, responseText, moderationStatus | |
| `likes/{autoId}` | fromUid, toUid, action(like/pass), createdAt | Unique (from,to) pairs enforced in transaction + block/self checks. |
| `matches/{matchId}` | userA(uid, canonical lower), userB(uid), status(active/ended), matchedAt, endedAt | Canonical pair uniqueness via deterministic doc id `userA_userB`. |
| `conversations/{matchId}` (doc id = matchId) | participantUids[2], status, createdAt, lastMessageAt | 1:1 with matches. |
| `conversations/{matchId}/messages/{msgId}` | senderUid, type, body OR private attachment path, moderationStatus, createdAt, deletedAt | Participant authorization enforced server-side; read/write only via Functions-authorized paths. |
| `blocks/{autoId}` | blockerUid, blockedUid, createdAt | Unique pair; self-block prevented; both-direction checks in discovery/matching. |
| `reports/{reportId}` | reporterUid, targetUid(null), targetMessageId(null), category, description, status, priority, createdAt, resolvedAt | Validation taxonomy: NCII, threats, impersonation, minors, danger = highest priority. |
| `moderationActions/{actionId}` | moderatorUid, targetUid, reportId(null), actionType, reasonCode, notes(restricted), createdAt, expiresAt | Notes visible to staff roles only. |
| `consentRecords/{recordId}` | uid, purpose, policyVersion, choice, locale, capturedAt, withdrawnAt | Granular, per-purpose, append-style. |
| `verificationRecords/{recordId}` | uid, method, status, providerRef, verifiedAt, retentionUntil | **No raw ID documents stored by default.** |
| `subscriptions/{subId}` | uid, planCode, provider, providerSubId, status, periodStart/End, cancelAtPeriodEnd | |
| `plans/{planId}` | code, displayName, countryCode, currency, amountMinor, interval, active, featureConfig | |
| `paymentEvents/{eventId}` (doc id = provider event id) | eventType, status, receivedAt, processedAt, safePayloadRef | Webhook idempotency key. Minimal payment data. |
| `privacyRequests/{requestId}` | uid, type(export/delete), status, createdAt, dueAt, completedAt, resolutionNote | Deletion must honour legal retention exceptions (documented). |
| `auditLogs/{logId}` | actorUid(null), action, targetType, targetId, reasonCode, requestId, createdAt | Restricted access, least privilege, retained per policy. |
| `supportCases/{caseId}` | uid(null), category, status, assignedTo, createdAt/updatedAt | |

## Discovery-specific structures

| Structure | Purpose |
|---|---|
| `discoveryPool/{uid}/candidates/{targetUid}` | Precomputed eligible summaries (recomputed on profile/preference/block changes); excludes blocks, pause/hide, ineligible accounts, non-matching intents/age/region. |
| `userBlocksIndex/{uid}/{blockedUid}` | Denormalized both-direction block index for fast exclusion checks. |
| `emailLookup/{normalizedEmailHash}` → uid | Enforces unique normalized email without range scans. |

## Writing rules (enforced in code + reviews)

1. Unique pairs (likes/blocks) and canonical matches via deterministic doc IDs or transactional checks.
2. All timestamps UTC (`Timestamp` type), server-injected.
3. Soft-delete (`deletedAt`) for messages/photos where needed; hard deletion only via tested privacy-deletion workflow with documented retention exceptions; audit records preserved.
4. Moderation notes and private contact data never appear in any client-readable payload.
5. Every collection documented here must have matching security rules that deny direct client access (`firestore.rules`).

## Fictional seed data

`firestore/seed/` contains clearly-fictional demo records only. Never insert real user data or identity documents into any dev/test environment.
