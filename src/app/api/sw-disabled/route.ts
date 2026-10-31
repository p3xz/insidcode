import { NextResponse } from "next/server";

export async function GET() {
  const isSwDisabled = process.env.NEXT_PUBLIC_SW_ENABLED === "false";
  return NextResponse.json(
    { disabled: isSwDisabled },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
