import { evaluatePodcast } from "@repo/eval-core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { runId?: string };
  const runId = body.runId || "demo-run";

  const report = evaluatePodcast({
    latencyMs: 2800,
    hasHighlights: true,
    estimatedCostUsd: 0.08,
    errorCount: 0
  });

  return NextResponse.json({ runId, ...report });
}
