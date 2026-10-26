

RELATIONSHIP PLATFORM
Complete Product Blueprint
for OpenCode
Privacy-first • Consent-led • India + International • Responsive Web MVP
Working brand: BONDORA (PROVISIONAL — trademark/domain clearance pending)
Prepared as a copy-ready implementation specification for an AI coding agent.


How to use this document in OpenCode
Is document ko project specification / source of truth ki tarah use karein. OpenCode mein pehle neeche diya gaya MASTER INSTRUCTION paste karein. Uske baad phases ko ek-ek karke execute karayein. AI coding agent se ek hi prompt mein poora production system banwane ke bajay har phase ke baad code run, tests aur review karna behtar hai.
MASTER INSTRUCTION — Copy/Paste into OpenCode
You are the lead product engineer and security-conscious architect for a privacy-first relationship platform. Build a real, maintainable, responsive web application MVP from this specification. Do not merely create mockups or placeholder buttons. Use a modular monolith, typed code, database migrations, validation, automated tests, and clear setup documentation.

PRODUCT:
- Provisional working name: Bondora. Do not claim the name, domain, or trademark is available; keep branding configurable.
- Target: India first, architecture ready for international expansion.
- Platform: responsive website first; design APIs and components so a mobile app can be added later.
- Relationship modes: serious dating and consensual casual dating, shown as separate, explicit user preferences. Never misrepresent intent.
- Adults only. Do not allow minors. Implement proportionate age assurance, abuse reporting, and escalation; have counsel review age-check design by launch.
- Product principles: informed consent, privacy by default, real profiles, transparent billing, user control, accessible UI, and safety features available to all users without payment.

TECH DEFAULTS:
- Frontend: Next.js App Router + TypeScript + Tailwind CSS, accessible components.
- Backend: Next.js server routes for MVP or a clearly separated NestJS service if complexity requires it; explain the choice in README.
- Database: PostgreSQL with Prisma ORM and versioned migrations.
- Authentication: established library/provider where feasible; secure HTTP-only, Secure, SameSite cookies; verified email; optional phone verification; MFA for staff.
- Media: private object storage, signed short-lived URLs, upload size/type validation, metadata/EXIF stripping, malware scanning hook, and moderation status.
- Realtime chat: WebSocket provider or a well-defined polling fallback for MVP; never expose messages to unrelated users.
- Tests: unit, integration, authorization/security, and key end-to-end tests.
- Use environment variables and .env.example; never commit secrets. Include seed data clearly marked as fictional.
- Prefer stable, supported versions available in the project environment. Do not add unnecessary dependencies.

IMPLEMENTATION RULES:
1. First inspect the repository and report its current structure before changing files.
2. Create a concise implementation plan and proposed folder structure.
3. Implement in phases, keeping the app runnable after each phase.
4. Before claiming completion, run lint, typecheck, migrations, tests, and build; report exact results and blockers.
5. No fake integrations: if email, payments, ID verification, storage, or moderation vendor credentials are absent, build a documented adapter interface and safe local/test mode.
6. All sensitive actions must be authorized server-side. Never trust a user ID, role, price, match ID, or permission supplied by the browser.
7. Include loading, empty, error, success, and mobile states. Avoid dead links and decorative controls that do nothing.
8. Document assumptions, decisions, risks, and manual setup steps.
9. Do not implement illegal, deceptive, non-consensual, underage, stalking, doxxing, covert tracking, or privacy-violating features.
10. Follow the full requirements in this document. If requirements conflict, prioritize user safety, privacy, legal review, and data minimization.
1. Product vision and scope
Goal: ek original relationship platform banana jo useful dating patterns se inspired ho, lekin kisi competitor ki branding, proprietary copy, UI assets, ya protected implementation ko copy na kare. Platform ka differentiator: clear intent, user-controlled discovery, privacy-by-default, transparent monetization, aur responsive safety operations.
MVP market: India; international readiness through country, locale, currency, time-zone, consent and retention configuration.
Core modes: Serious relationship; Consensual casual dating. User profile aur discovery settings mein intent clear rahe.
Working name: Bondora (provisional only). Alternatives: Truevia, PairBloom, MeetKind. Domain, trademark, company-name and app-store checks are mandatory before public use.
MVP excludes: anonymous random video chat, explicit adult-content marketplace, location stalking, hidden tracking, fake profiles, deceptive likes, dark patterns, paid safety access, and unreviewed biometric identity storage.
2. Feature inspiration — original implementation
Pattern
Original product interpretation
Safety guardrail
Fast discovery
Card-based discovery with like/pass and clear intent badges
No infinite dark-pattern loops; block/report always accessible
Conversation control
Mutual match before ordinary messaging; optional message request controls
No forced gender-based rule unless validated for target market and counsel
Prompt-rich profiles
Profile prompts, values, interests and relationship goals
Users control visibility; moderation rules for abuse
Intentional discovery
Optional limited daily recommendations and deeper compatibility filters
Do not imply paid users are more trustworthy
Proximity discovery
Optional broad-area discovery only if user opts in
Never show exact live location, home/work location or historical route
Privacy controls
Hide profile, pause discovery, photo visibility options, account export/deletion
Clear explanations and auditable consent
Discreet usage
Neutral notifications and private notification settings
No false billing descriptors or misleading cancellation flows

3. User journeys and screens
Route / screen
Required behavior
/
Landing page, product principles, safety links, clear sign-up CTA; no misleading claims.
/how-it-works
Explain matching, intent categories, consent and safety in plain language.
/signup
Adult eligibility confirmation, email, password or approved auth flow, terms/privacy consent version.
/login
Secure login, rate limiting, recovery flow, generic error messages.
/onboarding
Display name, birth date/age assurance flow, pronouns optional, country/region, languages, intent, preferences, interests, prompts, photos.
/discover
Eligible profiles only; like/pass; compatibility reasons; filters; empty state; report/block menu.
/likes
Show received/sent likes based on privacy and plan rules; no fake engagement.
/matches
Mutual matches; unmatched state; unmatch action; safety menu.
/chat/[id]
Only matched/authorized participants; message controls; report/block/unmatch; attachment moderation.
/profile/[id]
Publicly shareable profile fields only; no private contact/location data.
/settings/privacy
Profile visibility, discovery pause, notification privacy, data export/delete requests, consent controls.
/settings/account
Login methods, password/session controls, account status, delete/deactivate.
/safety
Safety guidance, report process, block behavior, emergency guidance, support contacts.
/plans
Clear plan features, prices, renewals, cancellation, refunds and local payment terms.
/help
Support forms and case status without exposing private data.
/legal/*
Terms, privacy notice, community guidelines, cookie notice if applicable, safety policy, refund policy.
/admin
Protected role-based console: reports, moderation queue, account actions, appeals, audit events, support.

4. MVP functional modules
Account and identity
Sign up/login/logout; verified email; session management; password reset; optional phone verification.
Age assurance suitable for adult-only service; block onboarding if underage. Do not retain ID images unless strictly necessary and legally reviewed.
Consent records include policy version, timestamp, locale and purpose; consent must be granular where required.
Profiles and preferences
Profile bio, prompts, interests, languages, broad location, photos, pronouns optional.
Separate relationship intent from discovery filters; users can edit or pause discovery.
Visibility controls and photo moderation status; strip EXIF/location metadata from uploads.
Discovery and matching
Server-side hard filters: adult eligibility, account status, block relations, selected intent compatibility, distance/region settings and user-defined preferences.
Ranking may use interests, values, profile completeness and recent activity without discriminatory or sensitive inference.
Example scoring only after hard exclusions: compatibility 40%, interests 30%, values/prompts 20%, freshness 10%; tune through transparent testing.
Messaging
Only mutual matches can start ordinary chats in MVP.
Text messages with rate limits, abuse detection, user report/block, unmatch and attachment restrictions.
No staff browsing of private messages by default; any exceptional access must be limited, justified and audited.
Trust and safety
Report profile/message/photo; block; unmatch; moderation queue; user appeal; repeat-offender controls.
Safety response priority for threats, non-consensual intimate imagery, impersonation, minors and credible danger.
Safety functions never require a premium subscription.
Privacy center
Pause/hide profile, visibility controls, notification privacy, consent preferences, export request, account deletion request.
Explain retention and deletion exceptions in plain language; log request state and completion.
Avoid collecting precise GPS, contact lists, address book or sensitive data without a documented necessity and legal review.
Premium and payments
Free core experience; optional premium filters, additional likes or boosts only after fair-use and safety review.
Show total price, billing period, auto-renewal, cancellation steps, refund/contact terms before purchase.
Use payment-provider hosted components; verify webhook signatures and make event processing idempotent.
Admin and analytics
Role-based admin console, report triage, moderation decisions, user appeals, support cases, audit trail.
Aggregate analytics; do not expose private chat contents or sensitive attributes to general analytics.
Staff access reviewed periodically; privileged accounts require MFA.
5. Suggested data model (PostgreSQL)
Use UUID primary keys, UTC timestamps, foreign keys, indexes, unique constraints and soft-delete only where justified. Use migrations; do not create an untracked database by hand.
Table
Key fields / notes
users
id UUID PK; email_normalized UNIQUE; password_hash or auth_provider_id; status; email_verified_at; created_at; updated_at; last_login_at. Never store plaintext passwords.
profiles
user_id PK/FK; display_name; birth_date or minimized age assurance result; bio; country_code; region_code; broad_location_label; languages; visibility; moderation_status; created_at; updated_at.
profile_photos
id; user_id FK; private_object_key; sort_order; moderation_status; created_at; deleted_at. Do not store public permanent object URLs.
relationship_preferences
user_id PK/FK; intent enum; desired_intents; age_min/max; distance_limit optional; preferred_regions; language preferences; dealbreakers; updated_at.
interests
id; name; category; active. Avoid sensitive categories unless necessary and reviewed.
profile_interests
user_id; interest_id; unique pair.
profile_prompts
id; user_id; prompt_key; response_text; moderation_status.
likes
id; from_user_id; to_user_id; action; created_at; unique pair; prevent self-like.
matches
id; user_a_id; user_b_id; status; matched_at; ended_at; unique canonical pair.
conversations
id; match_id UNIQUE/FK; status; created_at; last_message_at.
messages
id; conversation_id; sender_user_id; message_type; body or private attachment key; moderation_status; created_at; deleted_at. Enforce participant authorization.
blocks
id; blocker_user_id; blocked_user_id; created_at; unique pair; prevent self-block.
reports
id; reporter_user_id; target_user_id nullable; target_message_id nullable; category; description; status; priority; created_at; resolved_at.
moderation_actions
id; moderator_user_id; target_user_id; report_id nullable; action_type; reason_code; notes restricted; created_at; expires_at.
consent_records
id; user_id; purpose; policy_version; choice; locale; captured_at; withdrawn_at.
verification_records
id; user_id; method; status; provider_reference; verified_at; retention_until. Do not store raw ID documents by default.
subscriptions
id; user_id; plan_id; provider; provider_subscription_id; status; current_period_start/end; cancel_at_period_end.
plans
id; code; display_name; country_code; currency; amount_minor; interval; active; feature_config.
payment_events
id; provider_event_id UNIQUE; event_type; status; received_at; processed_at; safe_payload_reference. Minimize payment data.
privacy_requests
id; user_id; request_type; status; created_at; due_at; completed_at; resolution_note.
audit_logs
id; actor_user_id nullable; action; target_type; target_id; reason_code; request_id; created_at; restricted metadata only.
support_cases
id; user_id nullable; category; status; assigned_to; created_at; updated_at.

Recommended constraints: unique normalized email; unique pair for likes/blocks; canonical match pair; valid intent enum; all user-facing timestamps stored UTC; no cascading deletion that destroys legally required audit records without a retention policy. Define a tested data-deletion workflow.
6. API contract outline
Area
Example endpoints (adapt to selected framework)
Auth
POST /api/auth/signup; POST /api/auth/login; POST /api/auth/logout; POST /api/auth/forgot-password; POST /api/auth/reset-password; POST /api/auth/verify-email
Profile
GET/PATCH /api/me/profile; POST /api/me/photos; DELETE /api/me/photos/:id; GET /api/profiles/:id
Preferences
GET/PATCH /api/me/preferences; POST /api/me/discovery/pause
Discovery
GET /api/discovery; POST /api/likes; POST /api/passes
Matches
GET /api/matches; POST /api/matches/:id/unmatch
Chat
GET /api/conversations; GET/POST /api/conversations/:id/messages; POST /api/messages/:id/report
Safety
POST /api/reports; POST /api/blocks; DELETE /api/blocks/:id; GET /api/safety/status
Privacy
POST /api/privacy/export; POST /api/privacy/delete; GET /api/privacy/requests
Billing
GET /api/plans; POST /api/billing/checkout; POST /api/billing/webhook (provider signature required); POST /api/billing/cancel
Admin
GET /api/admin/reports; POST /api/admin/reports/:id/action; GET /api/admin/audit-logs (restricted)

For every endpoint define request/response schemas, validation, authentication, authorization, rate limits, error codes, audit behavior and tests. Use pagination for list endpoints. Never return internal moderation notes or other users’ private fields.
7. Roles and access control
Role
Allowed scope
Visitor
Public marketing pages, help and legal pages only.
Member
Own profile/settings; eligible discovery; own likes/matches/conversations; reports and blocks.
Premium member
Same member permissions plus paid feature entitlements; never extra access to other users’ private data or safety privileges.
Moderator
Assigned reports, necessary evidence and moderation actions; least-privilege access, audited.
Support agent
Support cases and limited account metadata; no unrestricted chat browsing or payment-card access.
Billing operator
Subscription/payment status and refund workflows; no profile private messages.
Admin
Operational configuration with least privilege; sensitive actions require reason and audit log.
Security/privacy officer
Incident, privacy request and audit review access; access itself logged.
System service
Scoped service identity with only required permissions; secrets stored in managed secret storage.

8. Security and privacy requirements
Passwords: use a maintained authentication library and Argon2id or a current approved password hashing configuration; never encrypt passwords reversibly or store plaintext.
Sessions: Secure, HttpOnly, SameSite cookies; rotate session identifiers; revoke sessions on password change and account compromise.
Access control: enforce ownership and match-participant checks on the server for every profile, conversation, message, photo and request.
Abuse prevention: rate-limit signup, login, likes, messages, uploads and report submission; add bot/fraud signals without covert invasive tracking.
Data protection: TLS in transit; encryption at rest and backups; managed secrets; key rotation plan; least privilege; tested backup restoration.
Media: private bucket, short-lived signed URLs, strict content type/size checks, malware scan, image moderation, EXIF stripping, safe file names.
Logs: never log passwords, access tokens, full payment credentials, sensitive profile text or message content unnecessarily; protect and limit audit log access.
Privacy: data inventory, purpose limitation, minimization, retention schedule, export/delete workflow, consent records and vendor processor inventory.
Security operations: dependency scanning, code review, threat model, incident response plan, vulnerability reporting contact and independent penetration test before broad launch.
Accessibility: keyboard navigation, visible focus, contrast, alt text, semantic forms and readable mobile layouts.
Messaging encryption: decide explicitly. If end-to-end encryption is not in MVP, describe transport/storage protections honestly and restrict staff access; do not claim E2EE falsely.
9. Legal and policy review checklist (not legal advice)
Before launch, obtain qualified counsel for each launch country and the actual product flow. Legal duties depend on implementation, company location, user location, data processed and service classification.
Jurisdiction / topic
Review items
India
DPDP Act 2023 and DPDP Rules 2025 commencement/transition schedule; applicable privacy notices, consent, rights, security safeguards, breach process and processors. Review IT Act and applicable IT Rules/intermediary obligations; consumer protection, e-commerce, payments, auto-renewal/refunds, advertising and grievance handling.
Adult-only service
Age assurance, underage prevention, escalation and deletion; do not market to minors. Review whether the service's exact features trigger additional obligations.
Abuse / intimate imagery
Non-consensual imagery, threats, impersonation, stalking, harassment, evidence handling, lawful requests and urgent safety escalations.
EU/EEA
GDPR roles/legal bases, special-category data, data subject rights, DPIA where needed, international transfers; DSA/platform duties depending on service.
United Kingdom
UK GDPR/Data Protection Act, Online Safety Act applicability, age assurance and safety obligations as applicable.
United States
State privacy laws, age-related laws, consumer protection, subscription/cancellation rules, breach notification, biometric/location rules where relevant.
Other markets
Country-by-country review for Canada, Australia and any added jurisdiction; do not enable a country merely because currency/localization exists.
App stores
Re-check current Apple App Review and Google Play policies at submission time, especially UGC, dating, sexual content, age rating, report/block, account deletion and payment rules.

Launch gate: no country is enabled until counsel/product owners document applicable requirements, required policy text, support/grievance contact, retention schedule, and operational ability to meet the requirements.
10. Monetization principles
Free: create profile, basic discovery, mutual matches, ordinary messaging, block/report, safety center, privacy controls and account deletion.
Potential paid features: extra preference filters, profile visibility controls with transparent limits, optional boosts, expanded daily discovery quota. Validate whether each feature harms fairness or safety.
Never paywall: reporting, blocking, emergency safety instructions, privacy controls, consent controls, or account deletion.
Show exact price, currency, billing interval, trial conditions, renewal terms, cancellation method, refund/contact terms before payment.
Price hypotheses for user research only (not verified market pricing): India ₹199–399/month entry tier; ₹499–999/month higher tier. International hypotheses $4.99–8.99 and $9.99–19.99. Test willingness-to-pay and local tax/payment rules before publishing.
Track: activation, profile completion, verified-user rate, match-to-conversation rate, retention, report rate, response times, safety outcomes, paid conversion, refunds, churn, CAC and contribution margin.
11. Technology architecture and repository layout
Frontend: Next.js App Router + TypeScript + Tailwind; accessible reusable components.
Database: PostgreSQL + Prisma; migrations and seed scripts.
Backend: modular monolith initially. Separate modules for auth, profiles, discovery, matches, messaging, safety, privacy, billing and admin.
Infrastructure: managed deployment, managed PostgreSQL, private object storage, queue/background jobs, error monitoring, secret manager and backups.
Future mobile app: API-first contracts; React Native may be evaluated after web MVP product validation.
app/                  # Next.js routes and layouts
components/            # Shared accessible UI
features/auth/
features/profiles/
features/discovery/
features/matches/
features/messaging/
features/safety/
features/privacy/
features/billing/
features/admin/
lib/                   # auth, db, validation, logging, rate limits
prisma/schema.prisma
prisma/migrations/
prisma/seed.ts          # fictional demo records only
tests/unit/
tests/integration/
tests/e2e/
docs/                  # architecture, API, threat model, runbooks
.env.example
README.md
12. Development roadmap
Phase
Scope
Exit criteria
0 — Discovery & setup (2–3 weeks)
Repository audit, requirements, brand clearance tasks, architecture, wireframes, threat model, policy drafts for counsel.
Approved spec; repo runs; decisions/risks documented.
1 — Foundations (3–5 weeks)
Responsive shell, auth, onboarding, profile/preferences, migrations, validation, basic tests.
Signup/login/onboarding work end-to-end; authorization tests pass.
2 — Discovery & matching (3–5 weeks)
Filters, likes/passes, mutual match logic, profile visibility, block-aware discovery.
No blocked pair is recommended; duplicate/self likes prevented; match tests pass.
3 — Chat & safety (3–5 weeks)
Conversation access, messaging, report/block/unmatch, moderation console, audit logs.
Only participants can read/write; report queue and staff roles tested.
4 — Privacy & billing (2–4 weeks)
Privacy requests, deletion/export workflow, subscription adapter, webhook verification, transparent plan UI.
Deletion/export tested; payment test mode idempotent; cancellation flow works.
5 — Private beta & launch readiness (2–4+ weeks)
Monitoring, penetration test, incident drill, content moderation staffing, legal sign-off, accessibility review.
Critical issues resolved; country launch gate passed; support process staffed.

Indicative planning range: roughly 13–24 weeks depending on team size, vendor integrations, compliance requirements and review findings. This is not a delivery guarantee.
13. MVP acceptance checklist
☐ App starts from documented clean-install instructions; .env.example is complete and contains no secrets.
☐ Database migrations apply cleanly and seed only fictional demo accounts.
☐ Adult-only onboarding and age assurance decision points are documented and tested.
☐ Login/signup/reset flows are rate-limited and use secure session handling.
☐ Every private API endpoint has authentication, authorization, schema validation and tests.
☐ Blocked users cannot see, like, match, message or contact each other through platform features.
☐ Only mutual-match participants can access a conversation; unmatch/block immediately restricts access as designed.
☐ Reports can be submitted, prioritized, assigned, resolved and audited; appeals have a defined path.
☐ Photos are private by default, scanned/moderated and stripped of location metadata.
☐ Privacy export and deletion workflows work, with documented legal retention exceptions.
☐ Payments are in test mode until credentials and legal review are complete; webhook signatures and idempotency are tested.
☐ Plan terms, auto-renewal, cancellation and refund contact are visible before checkout.
☐ Admin/moderator roles use least privilege and MFA; sensitive actions are audited.
☐ Lint, typecheck, unit, integration, end-to-end and production build commands run; results are reported honestly.
☐ Legal policies are reviewed for each enabled jurisdiction; support and incident response are ready.
14. OpenCode execution sequence
Step 1 — Ask OpenCode to inspect the current repository and report files, framework, package manager, existing code and risks. Do not overwrite anything yet.
Step 2 — Ask it to create docs/PRODUCT_BLUEPRINT.md from this specification and propose the folder structure, schema and implementation plan.
Step 3 — Implement Phase 1 only. Run migrations, lint, typecheck, tests and build; fix failures before proceeding.
Step 4 — Implement Phase 2; verify discovery exclusions and block rules with tests.
Step 5 — Implement Phase 3; test authorization, reporting, moderator permissions and audit logs.
Step 6 — Implement Phase 4 using provider adapters and test mode only until credentials/legal review are complete.
Step 7 — Run security, accessibility, privacy deletion, backup restore and launch-readiness reviews. Do not enable international markets without legal approval.
15. First follow-up prompt for OpenCode
Read the complete product blueprint provided to you. First inspect the existing repository without overwriting files. Return:
1) current repository summary,
2) missing prerequisites,
3) proposed architecture and folder tree,
4) database entity relationship summary,
5) implementation plan divided into the phases in the blueprint,
6) security/privacy risks and open decisions.
Do not start coding until you have returned this plan. After approval, implement Phase 1 only and keep the project runnable.
16. Important assumptions and items requiring human approval
Brand availability is not checked; Bondora is only a provisional working label.
Exact legal obligations and policy wording require qualified counsel and current jurisdiction-specific review.
Age assurance, ID verification, payment processing, email delivery, storage, moderation and analytics vendors must be selected after a privacy/security assessment.
Premium prices are hypotheses for research, not final prices.
Production deployment, domain purchase, credentials, vendor contracts, app-store submission and legal approval are outside the document itself.
Do not place real user data or real identity documents into development seeds or public test environments.
Reference starting points for review
These are starting points, not a substitute for checking current requirements at launch:
India DPDP Act/Rules and official MeitY materials: https://www.meity.gov.in/documents/act-and-policies
Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
Use official regulators and current local counsel guidance for each additional launch jurisdiction.
