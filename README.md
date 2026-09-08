# insidcode

A private, full-stack LeetCode-style programming practice platform built for mastering logical thinking, recursion, arrays, strings, and problem solving before data structures and algorithms.

## Overview

insidcode is built for developers who want a serious, distraction-free environment to practice coding challenges with isolated multi-language code execution, automated hidden test evaluation, practice streaks, and social leaderboards.

## Key Features

1. Password-Free OAuth Authentication
   - Seamless sign in via Google and GitHub OAuth.
   - Automatic unique username generation with case-insensitive validation and reserved username protection.
   - Zero password storage or email registration workflows.

2. Curriculum & Problem Directory
   - Six progressive phases:
     - Phase 1: Conditional Thinking
     - Phase 2: Looping and Patterns
     - Phase 3: Recursion
     - Phase 4: Basic Arrays
     - Phase 5: Strings
     - Phase 6: Mixed Logical Challenges
   - Searchable, filterable directory with difficulty categorization and phase progress tracking.

3. Monaco Code Editor & Execution Engine
   - Monaco Editor with dark developer theme tokens.
   - Supported languages: Python 3, JavaScript (Node.js), C, C++, and Java.
   - Real-time compilation and execution via Piston API with strict 10s timeouts, 100 KB code limit, and 32 KB stdin limit.
   - Language starter templates with unsaved modification alerts.

4. Server-Evaluated Hidden Tests & XP System
   - Submissions are evaluated sequentially on the server against hidden test cases.
   - Hidden tests are never exposed to client browsers.
   - First-solve XP rewards (Easy: 10 XP, Medium: 20 XP, Hard: 30 XP).
   - Duplicate solves do not award duplicate XP.

5. Gamification, Streaks & Social
   - Practice streaks calculated with timezone-safe UTC comparisons.
   - 12-month GitHub-style activity heatmaps.
   - Global and Friends circle leaderboards.
   - In-app notification dispatcher for achievements and admin announcements.

6. Administrator Control Center
   - Secure server-validated admin role guards.
   - Problem management: manual creation, editing, publishing, and hidden test case authoring.
   - User moderation: suspensions, role updates, and reason-backed manual XP adjustments.
   - Leaderboard freeze and unfreeze toggles.
   - Immutable audit logs for administrative tracking.

## Technology Stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- Code Editor: Monaco Editor (@monaco-editor/react)
- Backend: Next.js API Route Handlers, Zod Validation, Sliding-Window Rate Limiting
- Database: MongoDB Atlas, Mongoose ODM with cached serverless connections
- Authentication: NextAuth (Auth.js) with Google and GitHub OAuth
- Execution Engine: Piston API (isolated sandbox)
- Deployment Target: Vercel

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- MongoDB Atlas free cluster
- Google OAuth Client ID & Secret
- GitHub OAuth Client ID & Secret

### 2. Environment Configuration
Copy the example environment template:

```bash
cp .env.example .env.local
```

Fill in the environment variables:
- `MONGODB_URI`: MongoDB connection string.
- `AUTH_SECRET`: Random 32-character secret string.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: From GitHub Developer Settings.
- `PISTON_URL`: `https://emkc.org/api/v2/piston` or your self-hosted instance.

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed Curriculum Problems

```bash
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

### 6. Promote Administrator Account

Once you have signed in via OAuth with your account:

```bash
npm run seed:admin <your_username>
```

Your account will now have `role = "admin"` and access to `/admin`.

## Security Architecture

- Server-Side Authorization: API routes verify role and ban status directly against the database on every sensitive operation.
- No Hard-Coded Passwords: Admin promotion is handled through server scripts and database records.
- Hidden Test Privacy: Problem endpoints project test cases out of responses, ensuring test inputs and expected outputs remain strictly on the server.
- Execution Rate Limiting: Sliding-window rate limiters prevent execution abuse.

## Developer

**Namish Yadav**
- GitHub: [https://github.com/p3xz](https://github.com/p3xz)
- LinkedIn: [https://www.linkedin.com/in/namish-yadav-639769408/](https://www.linkedin.com/in/namish-yadav-639769408/)
- Instagram: [https://instagram.com/nam7sh](https://instagram.com/nam7sh)

## License

MIT License. See CREDITS for third-party acknowledgements.
