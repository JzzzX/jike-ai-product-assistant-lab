import { evaluateCommunity } from "@repo/eval-core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { runId?: string };
  const runId = body.runId || "community-demo-run";

  const report = evaluateCommunity({
    summaryLength: 120,
    hasEvidenceMap: true,
    riskFlags: 1
  });

  return NextResponse.json({ runId, ...report });
}
