export interface ChangelogRelease {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  tag?: "Latest" | "Major" | "Patch" | "Feature";
  added?: string[];
  changed?: string[];
  fixed?: string[];
  security?: string[];
  removed?: string[];
  database?: string[];
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "v1.4.0",
    releaseDate: "September 27, 2026",
    title: "Duel Expansion, Cookie Consent & Legal Infrastructure",
    summary:
      "Very Easy Duel mode for beginners, Per-Problem Duels from any problem page, Duel Ratio replacing K/D, cookie consent banner with granular preferences, centralized legal versioning, and a refreshed Privacy Policy and Terms of Service.",
    tag: "Latest",
    added: [
      "Very Easy Duel mode: a beginner-friendly difficulty tier covering variables, arithmetic, basic I/O, simple conditionals, and counting. Fully integrated with the existing Elo & Duel Points engine.",
      "Per-Problem Duel: a DUEL action button on individual problem pages that creates a locked 1-round Duel match using that specific problem. Problem identity and difficulty are derived server-side; clients cannot forge the difficulty.",
      "Cookie Consent banner: non-intrusive, accessible UI with Accept All, Reject Optional, and Manage Preferences actions. Preferences are persisted to localStorage (versioned) and synced server-side for authenticated users.",
      "Cookie Preferences Modal: granular toggles for Necessary (always on), Functional, and Analytics cookie categories with ARIA switch roles.",
      "Privacy Choices button in the site footer, allowing users to reopen the Cookie Preferences Modal at any time.",
      "POST /api/user/legal-consent: server-authoritative endpoint for recording cookie consent preferences and/or full Privacy Policy + Terms of Service re-consent.",
      "GET /api/user/legal-consent: endpoint returning the user's current consent status against active legal document versions.",
      "Centralized legal version configuration (src/config/legal.ts) with CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION, CURRENT_COOKIE_POLICY_VERSION constants and checkUserConsentStatus helper.",
    ],
    changed: [
      "K/D Ratio renamed to Duel Ratio across all user-facing UI, profile stats, Stats page, and API payloads. Calculation (Wins / Losses) and safe zero-loss handling preserved.",
      "Privacy Policy updated to accurately disclose: OAuth disconnect, voluntary account deletion, Duel competitive metrics (Elo, Duel Points, Duel Rank, Duel Ratio), and cookie/consent data collection.",
      "Terms of Service updated to cover: Duel Ratio and Elo manipulation as prohibited conduct, voluntary account self-deletion rights, and expanded progress revocation scope.",
      "Duel difficulty enum extended to include 'Very Easy' across Question, DuelRoom, and DuelRound models.",
    ],
    security: [
      "Per-Problem Duel difficulty derived exclusively from the server-fetched problem record: client-supplied difficulty is ignored to prevent match difficulty forgery.",
      "Cookie consent version validated server-side on every POST to /api/user/legal-consent; version mismatches return 409 Conflict.",
    ],
    database: [
      "User schema extended with cookiePolicyVersion, consentVersion, cookieConsent (nested object), and legalConsent (nested object with versioned fields).",
      "DuelRoom and DuelRound difficulty enum updated to include 'Very Easy'.",
      "Question difficulty enum updated to include 'Very Easy' with 16 foundational problems categorized.",
    ],
  },
  {
    version: "v1.3.0",
    releaseDate: "September 17, 2026",
    title: "Security Hardening, Banned UX & Appeal Portal",
    summary:
      "Comprehensive platform security audit, authoritative server-side admin protection, central 403 suspension interception, dedicated banned user experience, and formal suspension appeal workflow.",
    tag: "Major",
    added: [
      "Dedicated Suspended User Appeal portal (/feedback/appeal) for restricted accounts to submit formal review requests.",
      "Integrated verified Suspension Details card on restricted account screen (/suspended) displaying sanitized ban event metadata and live appeal status in Indian Standard Time (IST).",
      "Dedicated Account Restored flow (/account-restored) requiring explicit Terms of Use & Privacy Policy re-acknowledgment upon appeal approval.",
      "Admin Suspension Appeals console (/admin/appeals) with inspection modal, approval/rejection workflows, and audit trail.",
      "Dedicated full-page Banned Account interface (/suspended) with clear security notice and restricted navigation.",
      "Central window.fetch response interceptor to immediately detect 403 suspension responses across all client components.",
      "Server-side one-appeal limit per suspension returning HTTP 409 Conflict on duplicate attempts.",
      "Atomic account restoration lifecycle upon administrator appeal approval.",
      "Global HTTP security headers (HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy).",
      "Public Changelog & Patch Notes page (/changelog) tracking chronological platform releases.",
    ],
    changed: [
      "Enhanced JWT session callback to dynamically synchronize user profile, ban state, and onboarding status directly from MongoDB on every session read.",
      "Restricted Navbar and BottomNav modes when viewing restricted pages or when an account is banned.",
      "Optimized search rate limiter to prioritize authenticated user IDs over raw IP addresses.",
    ],
    fixed: [
      "Fixed stale profile URL redirect bug where changing a username in Settings left the navbar redirecting to the old handle.",
      "Fixed critical race condition in Duel round submission where simultaneous submissions could result in duplicate round winners.",
      "Fixed stuck room states when a player departs an active Duel match by automatically awarding forfeit victory to the opponent.",
      "Eliminated question selection bias in Duel room creation with a cryptographically uniform Fisher-Yates shuffle.",
      "Fixed missing notification ID validation in notifications PATCH route.",
    ],
    security: [
      "Implemented authoritative server component authorization in /admin layout (requireAdminUser) preventing client-side route access by non-admins.",
      "Added automatic privilege escalation auto-suspension (isBanned: true) and immutable AdminAction audit logging upon unauthorized admin mutations.",
      "Enforced strict server-side verification on /api/feedback/appeal ensuring only legitimately suspended accounts can submit appeals.",
      "Enforced in-flight submission lock to block concurrent double-submissions on the problem workspace.",
    ],
    database: [
      "Created Appeal collection with partial unique index on (userId) for active pending appeals.",
      "Added 60-day automatic TTL index on the Notification collection to prevent unbounded storage accumulation.",
      "Added compound unique index (userId, problemId, language) on LanguageSolve collection to prevent duplicate points races.",
      "Configured 2-hour TTL index on DuelRoom expiresAt field for automatic ephemeral match cleanup.",
    ],
  },
  {
    version: "v1.2.0",
    releaseDate: "September 14, 2026",
    title: "Duel Arena & Competitive Architecture",
    summary:
      "Introduced real-time competitive 3-round 1v1 Duels, live timers, private room codes, early finish detection, and duel leaderboard tracking.",
    tag: "Feature",
    added: [
      "1v1 Competitive Duel Lobby (/duel) with room creation and 6-character code entry.",
      "Real-time Duel Arena workspace (/duel/[roomCode]) with synchronized countdown, match timer, and live opponent status.",
      "Best-of-3 round structure with difficulty selection (Easy, Medium, Hard) and early match conclusion at 2–0.",
      "Duel win/loss statistics tracking on user profiles and leaderboards.",
    ],
    changed: [
      "Upgraded problem execution pipeline with durable background execution queue supporting asynchronous status polling.",
      "Refactored leaderboard metrics to factor in competitive duel performance and streaks.",
    ],
    database: [
      "Created DuelRoom schema tracking round data, problem IDs, player scores, and match state.",
      "Added duelsWon, duelsPlayed, and duelsLost fields to the User schema.",
    ],
  },
  {
    version: "v1.1.0",
    releaseDate: "September 12, 2026",
    title: "Legal Consent, Onboarding & Swiss Editorial Design",
    summary:
      "Introduced user onboarding flow, legal policies, theme system, and refined typography with Swiss industrial aesthetics.",
    tag: "Feature",
    added: [
      "Interactive Onboarding flow (/onboarding) with live username availability validation.",
      "Terms of Service (/terms), Privacy Policy (/privacy), and Platform Integrity Policy (/integrity) documentation.",
      "Dark / Light / System theme toggle with zero-flicker inline script initialization.",
      "General Feedback & Bug Report portal (/feedback) with Resend email delivery.",
    ],
    changed: [
      "Refined homepage with industrial developer aesthetic, modular grid layout, and JetBrains Mono accents.",
      "Integrated OnboardingGuard component to ensure legal consent prior to platform usage.",
    ],
  },
  {
    version: "v1.0.0",
    releaseDate: "September 1, 2026",
    title: "Initial Platform Release",
    summary:
      "The foundational launch of InsidCode: a disciplined logic-first coding platform designed to master algorithmic thinking before jumping into complex DSA.",
    tag: "Major",
    added: [
      "330+ structured coding challenges categorized into Logic, Arrays, Recursion, and Algorithms.",
      "Monaco-powered multi-language Code Editor supporting Python, JavaScript, C, C++, and Java.",
      "Sandboxed code execution with automated test case evaluation and hidden edge cases.",
      "NextAuth Google and GitHub OAuth authentication.",
      "XP, streak tracking, language points, global leaderboard, and personal developer statistics.",
      "Global search modal (Cmd+K / Ctrl+K) for instant problem lookup.",
    ],
    database: [
      "Initialized User, Question, Submission, Execution, Achievement, and AdminAction collections in MongoDB.",
    ],
  },
];
