import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { CodeExecutionSchema } from "@/lib/validations";
import { executeCodeWithPiston } from "@/lib/piston";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const rateLimit = checkRateLimit(`exec_${user._id}`, { limit: 20, windowMs: 60000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many execution requests. Please wait before running again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = CodeExecutionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid execution payload";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { language, code, customInput } = parseResult.data;
    const result = await executeCodeWithPiston(language, code, customInput);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Execute route error:", error);
    return NextResponse.json(
      { error: "Code execution is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
