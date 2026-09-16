import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { requireAdminMutationUser } from "@/lib/security";
import { Question } from "@/models/Question";
import { AdminAction } from "@/models/AdminAction";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    await connectToDatabase();
    const { id } = await params;

    const question = await Question.findOne({
      $or: [{ problemId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!question) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    return NextResponse.json({ problem: question });
  } catch (error) {
    console.error("Admin single problem GET error:", error);
    return NextResponse.json({ error: "Failed to fetch problem." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminMutationUser(req, "PROBLEM_EDIT");
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const question = await Question.findOne({
      $or: [{ problemId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!question) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    const previousValue = JSON.stringify({
      title: question.title,
      phase: question.phase,
      difficulty: question.difficulty,
      xp: question.xp,
      isPublished: question.isPublished,
    });

    // Update allowed fields
    if (body.title) question.title = body.title;
    if (body.phase) question.phase = body.phase;
    if (body.difficulty) question.difficulty = body.difficulty;
    if (body.description) question.description = body.description;
    if (body.constraints) question.constraints = body.constraints;
    if (body.examples) question.examples = body.examples;
    if (body.starterTemplates) question.starterTemplates = body.starterTemplates;
    if (body.tags) question.tags = body.tags;
    if (body.xp) question.xp = body.xp;
    if (body.hiddenTestCases) question.hiddenTestCases = body.hiddenTestCases;
    if (typeof body.isPublished === "boolean") question.isPublished = body.isPublished;

    await question.save();

    const newValue = JSON.stringify({
      title: question.title,
      phase: question.phase,
      difficulty: question.difficulty,
      xp: question.xp,
      isPublished: question.isPublished,
    });

    // Log admin action
    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: "PROBLEM_EDIT",
      targetProblemId: question.problemId,
      previousValue,
      newValue,
      reason: body.editReason || "Admin edited problem configuration",
    });

    return NextResponse.json({
      success: true,
      message: "Problem updated successfully.",
      problem: question,
    });
  } catch (error) {
    console.error("Admin single problem PUT error:", error);
    return NextResponse.json({ error: "Failed to update problem." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminMutationUser(req, "PROBLEM_DELETE");
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;
    await connectToDatabase();
    const { id } = await params;

    const question = await Question.findOneAndDelete({
      $or: [{ problemId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!question) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    // Log admin action
    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: "PROBLEM_DELETE",
      targetProblemId: question.problemId,
      previousValue: JSON.stringify({
        problemId: question.problemId,
        title: question.title,
      }),
      reason: "Admin deleted problem",
    });

    return NextResponse.json({
      success: true,
      message: `Problem ${question.problemId} deleted successfully.`,
    });
  } catch (error) {
    console.error("Admin single problem DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete problem." }, { status: 500 });
  }
}
