import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminMutationUser } from "@/lib/security";
import { checkRateLimit } from "@/lib/rateLimit";
import { AdminAction } from "@/models/AdminAction";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
  CURRENT_COOKIE_POLICY_VERSION,
} from "@/config/legal";

const FIRST_NAMES = [
  "Aarav", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Vivaan", "Aditya",
  "Ananya", "Diya", "Aadhya", "Myra", "Sara", "Ira", "Priya", "Sneha", "Kavya", "Riya",
  "Kabir", "Yash", "Aryan", "Dev", "Nikhil", "Sahil", "Varun", "Karan", "Manav", "Dhruv",
  "Pooja", "Neha", "Simran", "Anjali", "Ritika", "Shreya", "Tanvi", "Nisha", "Komal", "Divya",
  "Rahul", "Amit", "Suresh", "Vikram", "Rajesh", "Sandeep", "Harsh", "Gaurav", "Abhishek", "Naman",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Mehta", "Patel", "Reddy", "Iyer", "Nair", "Singh", "Yadav",
  "Khan", "Das", "Kulkarni", "Joshi", "Agarwal", "Mishra", "Chopra", "Bose", "Pillai", "Menon",
  "Rao", "Chauhan", "Thakur", "Pandey", "Tiwari", "Saxena", "Bansal", "Khanna", "Arora", "Malhotra",
  "Pawar", "Shinde", "Deshmukh", "Patil", "Naik", "Shetty", "Hegde", "Murthy", "Anand", "Chandra",
];

const LANGUAGES = ["python", "javascript", "c", "cpp", "java"] as const;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeUsername(first: string, last: string, used: Set<string>): string {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  const patterns = [
    `${f}_${l}`,
    `${f}${l}`,
    `${f}_${l}${randInt(1, 99)}`,
    `${f}${randInt(10, 99)}_${l}`,
    `${f[0]}_${l}`,
    `${f}_${l[0]}${randInt(1, 9)}`,
    `${l}_${f}${randInt(1, 99)}`,
  ];
  for (const p of shuffle(patterns)) {
    const u = p.slice(0, 20);
    if (/^[A-Za-z0-9_]{3,20}$/.test(u) && !used.has(u.toLowerCase())) {
      used.add(u.toLowerCase());
      return u;
    }
  }
  // Fallback: guaranteed unique
  let n = 1;
  while (used.has(`${f}_${l}_${n}`.toLowerCase())) n++;
  const u = `${f}_${l}_${n}`.slice(0, 20);
  used.add(u.toLowerCase());
  return u;
}

/**
 * POST /api/admin/seed-users
 *
 * Seeds realistic demo users (provider: "seed") for the leaderboard.
 * Admin only. Idempotent: skips when seed users already exist unless ?force=1.
 */
export async function POST(req: NextRequest) {
  const adminResult = await requireAdminMutationUser(req, "SEED_USERS");
  if (!adminResult.admin) {
    return NextResponse.json(
      { error: adminResult.error || "Forbidden" },
      { status: adminResult.status }
    );
  }

  const admin = adminResult.admin;

  const rateLimit = checkRateLimit(`admin_seed_${admin._id.toString()}`, { limit: 5, windowMs: 60000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before running seeder again." },
      { status: 429 }
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SEEDING !== "true") {
    return NextResponse.json(
      { error: "Demo user seeding is blocked in production environments." },
      { status: 403 }
    );
  }

  interface SeedRequestBody {
    force?: boolean;
    confirmPhrase?: string;
    count?: number | string;
  }
  let body: SeedRequestBody = {};
  try {
    body = await req.json();
  } catch {
    // body optional
  }

  const force = req.nextUrl.searchParams.get("force") === "1" || body.force === true;
  if (force && body.confirmPhrase !== "CONFIRM_SEED_FORCE_RESET") {
    return NextResponse.json(
      { error: "Bulk deletion of seed users requires typed confirmation phrase: 'CONFIRM_SEED_FORCE_RESET'." },
      { status: 400 }
    );
  }

  const rawCount = req.nextUrl.searchParams.get("count") ?? (body.count !== undefined ? String(body.count) : "100");
  const countParam = parseInt(rawCount, 10);
  const count = Math.min(Math.max(countParam || 100, 1), 500);

  await connectToDatabase();

  const existing = await User.countDocuments({ provider: "seed" });
  if (existing > 0 && !force) {
    return NextResponse.json({
      seeded: 0,
      existing,
      message: "Seed users already exist. Provide force: true with confirmPhrase: 'CONFIRM_SEED_FORCE_RESET' to reseed.",
    });
  }
  if (force && existing > 0) {
    await User.deleteMany({ provider: "seed" });
  }

  // Real problem IDs so profiles/stats stay consistent
  const questions = await Question.find({ isPublished: true })
    .select("problemId difficulty")
    .lean();
  const problemIds = questions.map((q) => q.problemId).filter(Boolean);
  if (problemIds.length === 0) {
    return NextResponse.json(
      { error: "No published questions found; cannot seed solved problems." },
      { status: 400 }
    );
  }

  // Reserve existing usernames to avoid collisions
  const taken = new Set<string>(
    (await User.find({}).select("usernameNormalized").lean()).map((u) =>
      (u.usernameNormalized || "").toLowerCase()
    )
  );

  const now = Date.now();
  const docs = [];

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const username = makeUsername(first, last, taken);

    // XP tier: a few grinders, a solid middle, a long tail of casuals
    const roll = Math.random();
    let xp: number;
    if (roll < 0.05) xp = randInt(3000, 6500);
    else if (roll < 0.25) xp = randInt(1200, 3000);
    else if (roll < 0.65) xp = randInt(400, 1200);
    else xp = randInt(20, 400);

    const solvedCount = Math.min(
      problemIds.length,
      Math.max(1, Math.round(xp / randInt(18, 30)))
    );
    const solved = shuffle(problemIds).slice(0, solvedCount);
    const attemptedExtra = shuffle(
      problemIds.filter((id) => !solved.includes(id))
    ).slice(0, randInt(0, Math.min(12, Math.floor(solvedCount / 2))));
    const attempted = [...solved, ...attemptedExtra];

    const currentStreak = roll < 0.6 ? randInt(0, 21) : randInt(0, 4);
    const longestStreak = Math.max(currentStreak, randInt(currentStreak, currentStreak + 25));
    const totalSubmissions = solvedCount * randInt(2, 4) + randInt(0, 10);
    const acceptedSubmissions = Math.min(totalSubmissions, solvedCount + randInt(0, 3));

    // Language points: 1-2 preferred languages
    const languagePoints: Record<string, number> = {
      python: 0, javascript: 0, c: 0, cpp: 0, java: 0,
    };
    const langs = shuffle([...LANGUAGES]).slice(0, randInt(1, 2));
    let remaining = xp;
    langs.forEach((lang, idx) => {
      const share = idx === langs.length - 1 ? remaining : Math.round(remaining * (0.3 + Math.random() * 0.4));
      languagePoints[lang] = share;
      remaining -= share;
    });

    const createdAt = new Date(now - randInt(5, 240) * 24 * 60 * 60 * 1000);
    const lastActiveDate =
      currentStreak > 0
        ? new Date(now - randInt(0, 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : new Date(now - randInt(2, 60) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    docs.push({
      username,
      usernameNormalized: username.toLowerCase(),
      displayName: `${first} ${last}`,
      email: `${username}@example.com`,
      provider: "seed",
      providerAccountId: `seed-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      xp,
      currentStreak,
      longestStreak,
      lastActiveDate,
      solvedProblems: solved,
      attemptedProblems: attempted,
      totalSubmissions,
      acceptedSubmissions,
      leaderboardVisible: true,
      isBanned: false,
      preferences: {
        editorFontSize: pick([12, 13, 14, 14, 16]),
        minimap: Math.random() < 0.25,
        defaultLanguage: pick(langs),
        reducedMotion: false,
        soundEnabled: Math.random() < 0.3,
      },
      languagePoints,
      onboardingCompleted: true,
      privacyPolicyAccepted: true,
      termsAccepted: true,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
      cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
      legalConsent: {
        accepted: true,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        termsVersion: CURRENT_TERMS_VERSION,
        cookiePolicyVersion: CURRENT_COOKIE_POLICY_VERSION,
        acceptedAt: createdAt,
        consentVersion: CURRENT_COOKIE_POLICY_VERSION,
      },
      createdAt,
      updatedAt: new Date(),
    });
  }

  const inserted = await User.insertMany(docs);

  await AdminAction.create({
    adminId: admin._id.toString(),
    adminUsername: admin.username,
    action: "SEED_USERS_RUN",
    newValue: JSON.stringify({ seededCount: inserted.length, force }),
    reason: `Admin seeded ${inserted.length} demo users${force ? " (force reset)" : ""}`,
  });

  return NextResponse.json({
    seeded: inserted.length,
    message: `Seeded ${inserted.length} demo users.`,
  });
}
