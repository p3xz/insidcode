# InsidCode

> InsidCode is a full-stack, LeetCode-style programming practice platform: a serious, distraction-free environment for mastering logical thinking, recursion, arrays, strings, and problem solving before data structures and algorithms.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

Built as a personal project to have a focused space for practicing programming fundamentals, with a curriculum aimed at mastering logical thinking, recursion, arrays, and strings before moving on to data structures and algorithms. Built in September 2026.

## Features

- **Password-free OAuth sign-in**: Google and GitHub OAuth with automatic unique username generation, case-insensitive validation, and reserved username protection. No passwords are ever stored.
- **Six-phase curriculum directory**: searchable, filterable problems across Conditional Thinking, Looping and Patterns, Recursion, Basic Arrays, Strings, and Mixed Logical Challenges, with difficulty labels and phase progress tracking.
- **Monaco editor with sandboxed execution**: dark developer theme with Python 3, JavaScript (Node.js), C, C++, and Java, run through the OnlineCompiler API with a strict 10s timeout, 100 KB code limit, and 32 KB stdin limit.
- **Server-evaluated hidden tests and XP**: submissions run on the server against hidden test cases that never reach the browser; first solves earn 10 XP for Easy, 20 XP for Medium, and 30 XP for Hard, while repeat solves earn nothing.
- **Gamification and social**: timezone-safe practice streaks, 12-month GitHub-style activity heatmaps, global and friends leaderboards, and in-app notifications for achievements and admin announcements.
- **Admin control center**: server-validated role guards, problem and hidden test case management, user moderation with suspensions, role updates, and manual XP adjustments, leaderboard freeze toggles, and immutable audit logs.

## Tech Stack

![TypeScript](https://skillicons.dev/icons?i=ts) ![Next.js](https://skillicons.dev/icons?i=nextjs) ![React](https://skillicons.dev/icons?i=react) ![Tailwind CSS](https://skillicons.dev/icons?i=tailwind) ![Node.js](https://skillicons.dev/icons?i=nodejs) ![MongoDB](https://skillicons.dev/icons?i=mongodb) ![Vercel](https://skillicons.dev/icons?i=vercel)

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- Code Editor: Monaco Editor (@monaco-editor/react)
- Backend: Next.js API Route Handlers, Zod Validation, Sliding-Window Rate Limiting
- Database: MongoDB Atlas, Mongoose ODM with cached serverless connections
- Authentication: NextAuth (Auth.js) with Google and GitHub OAuth
- Execution Engine: ONLINECOMPILER API (isolated sandbox)
- Email: Resend (feedback and ban-appeal forms)
- Deployment Target: Vercel

### Why this stack

- Next.js (App Router): frontend pages and backend API routes live in one codebase and deploy as a single app.
- React: component-based UI for the editor, dashboard, and admin screens.
- TypeScript: type safety shared across client, server, and database models.
- Tailwind CSS and Lucide Icons: utility-first dark developer styling with consistent icons.
- Monaco Editor: the same editor engine that powers VS Code, running in the browser.
- MongoDB Atlas and Mongoose: document storage for problems, curriculum phases, users, submissions, and streaks, with cached connections suited to serverless.
- NextAuth: password-free sign in with Google and GitHub, so no passwords are ever stored.
- ONLINECOMPILER API: isolated sandboxed code execution with strict timeouts and size limits, so untrusted code never runs on the app server.
- Zod: request validation on API routes.
- Sliding-window rate limiting: keeps execution and API endpoints from being abused.
- Resend: email delivery for the feedback and ban-appeal forms.
- Vercel: deployment target, matching the Next.js stack.

## Quick Start

### Prerequisites

- Node.js 18.17+ or 20+
- Next.js 15.5.25 (installed via `npm install`)
- MongoDB Atlas cluster (free tier works)
- Google OAuth Client ID and Client Secret
- GitHub OAuth Client ID and Client Secret

### Installation

1. Clone the repository:

```bash
git clone https://github.com/p3xz/insidcode.git
cd insidcode
```

2. Install dependencies:

```bash
npm install
```

3. Configure the environment:

```bash
cp .env.example .env.local
```

Fill in the variables described in [Configuration](#configuration).

4. Seed the curriculum problems:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Usage

Sign in with Google or GitHub OAuth, pick a phase from the curriculum directory, write a solution in the Monaco editor, and submit it to be evaluated against hidden test cases.

To grant yourself admin access after signing in:

```bash
npm run seed:admin <your_username>
```

Your account gets `role = "admin"` and access to `/admin`.

### How it works

- Users sign in with Google or GitHub OAuth and get a unique username automatically.
- The six-phase curriculum directory offers searchable, filterable problems with difficulty labels and progress tracking.
- Solutions are written in the Monaco editor and run in an isolated ONLINECOMPILER sandbox with a 10s timeout.
- Submissions are evaluated on the server against hidden test cases that are projected out of API responses and never reach the browser.
- First solves earn XP; practice streaks, heatmaps, and leaderboards track progress over time, with in-app notifications for achievements.
- Admins manage problems, hidden tests, users, and leaderboards from a role-guarded control center with immutable audit logs.

## Configuration

| Variable | Description | Default | Required |
|---|---|---|---|
| `MONGODB_URI` | MongoDB connection string | None | Yes |
| `AUTH_SECRET` | Random 32-character secret used by Auth.js to encrypt sessions | None | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID from Google Cloud Console | None | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret from Google Cloud Console | None | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID from GitHub Developer Settings | None | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret from GitHub Developer Settings | None | Yes |
| `ONLINECOMPILER_API_KEY` | API key for the OnlineCompiler execution sandbox | None | Yes |
| `RESEND_API_KEY` | Resend API key for the feedback and ban-appeal emails | None | No |
| `FEEDBACK_TO_EMAIL` | Recipient address for the feedback form | None | No |
| `ADMIN_EMAIL` | Email address automatically granted the admin role on sign in | None | No |
| `MAX_CONCURRENT_EXECUTIONS` | Maximum concurrent code executions in the server queue | `4` | No |
| `MAX_QUEUE_CAPACITY` | Maximum pending executions the server queue holds | `100` | No |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console site verification token | None | No |

Never commit real values for these variables; keep them in `.env.local`, which is gitignored.

## Security

- Server-Side Authorization: API routes verify role and ban status directly against the database on every sensitive operation.
- No Hard-Coded Passwords: Admin promotion is handled through server scripts and database records.
- Hidden Test Privacy: Problem endpoints project test cases out of responses, ensuring test inputs and expected outputs remain strictly on the server.
- Execution Rate Limiting: Sliding-window rate limiters prevent execution abuse.

## Contributing

Contributions are welcome. Open an issue first to discuss the change, then submit a pull request with a clear description of what changed and why.

## Credits

Built by **Namish Yadav**
- GitHub: [https://github.com/p3xz](https://github.com/p3xz)
- LinkedIn: [https://www.linkedin.com/in/namish-yadav-639769408/](https://www.linkedin.com/in/namish-yadav-639769408/)
- Instagram: [https://instagram.com/nam7sh](https://instagram.com/nam7sh)

## License

MIT License. Copyright (c) 2026 p3xz. See [LICENSE](LICENSE) for the full text.
