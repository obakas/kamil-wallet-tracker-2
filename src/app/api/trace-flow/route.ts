import { traceFlowEngine } from "@/lib/traceFlowEngine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { wallets } = await req.json();

  if (!Array.isArray(wallets) || wallets.length === 0) {
    return NextResponse.json({ error: "Invalid wallet list." }, { status: 400 });
  }

  try {
    const flows = await traceFlowEngine(wallets);
    return NextResponse.json(flows, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
