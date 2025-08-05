// app/api/patterns/route.ts
import { NextResponse } from "next/server";
import { detectRepeatedPatterns } from "@/lib/detectRepeatedPatterns";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const traceData = body.traceData; // expects Record<string, TraceFlowItem[]>

    const result = detectRepeatedPatterns(traceData);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("Pattern detection error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
