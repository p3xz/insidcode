import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { Question } from "@/models/Question";
import { AdminAction } from "@/models/AdminAction";
import { LIMITS } from "@/lib/constants";
import { z } from "zod";

const AdminProblemSchema = z.object({
  problemId: z.string().min(1).max(10).regex(/^\d+$/, "Problem ID must be digits (e.g. 001)"),
  title: z.string().min(1).max(LIMITS.PROBLEM_TITLE_MAX),
  slug: z.string().min(1).max(120),
  phase: z.number().int().min(1).max(6),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  description: z.string().min(10),
  constraints: z.array(z.string()).default([]),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    )
    .min(1, "At least one example is required"),
  starterTemplates: z
    .object({
      python: z.string().optional(),
      javascript: z.string().optional(),
      c: z.string().optional(),
      cpp: z.string().optional(),
      java: z.string().optional(),
    })
    .default({}),
  tags: z.array(z.string()).default([]),
  xp: z.number().int().min(10).max(100),
  hiddenTestCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      })
    )
    .min(1, "At least one hidden test case is required"),
  isPublished: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const phase = searchParams.get("phase");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (phase && parseInt(phase, 10) >= 1 && parseInt(phase, 10) <= 6) {
      query.phase = parseInt(phase, 10);
    }

    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    if (search.trim()) {
      const sanitized = search.trim().slice(0, LIMITS.SEARCH_MAX);
      const regex = new RegExp(sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: regex }, { problemId: regex }, { slug: regex }];
    }

    const totalCount = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const questions = await Question.find(query)
      .sort({ problemId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        hiddenTestCount: q.hiddenTestCases?.length || 0,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Admin get problems error:", error);
    return NextResponse.json({ error: "Failed to load problems." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;
    const body = await req.json();

    const parseResult = AdminProblemSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid problem schema";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = parseResult.data;
    await connectToDatabase();

    // Check unique ID and slug
    const existingId = await Question.findOne({ problemId: data.problemId });
    if (existingId) {
      return NextResponse.json(
        { error: `Problem ID "${data.problemId}" already exists.` },
        { status: 400 }
      );
    }

    const existingSlug = await Question.findOne({ slug: data.slug.toLowerCase() });
    if (existingSlug) {
      return NextResponse.json(
        { error: `Problem slug "${data.slug}" already exists.` },
        { status: 400 }
      );
    }

    const newQuestion = await Question.create({
      ...data,
      slug: data.slug.toLowerCase(),
    });

    // Audit log
    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: "PROBLEM_CREATE",
      targetProblemId: newQuestion.problemId,
      newValue: JSON.stringify({
        title: newQuestion.title,
        phase: newQuestion.phase,
        difficulty: newQuestion.difficulty,
        xp: newQuestion.xp,
      }),
      reason: "Admin manually created problem",
    });

    return NextResponse.json({
      success: true,
      message: "Problem created successfully.",
      problem: newQuestion,
    });
  } catch (error) {
    console.error("Admin create problem error:", error);
    return NextResponse.json({ error: "Failed to create problem." }, { status: 500 });
  }
}
