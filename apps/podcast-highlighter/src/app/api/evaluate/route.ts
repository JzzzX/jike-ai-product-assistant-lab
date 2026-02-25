import { evaluatePodcast } from "@repo/eval-core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    runId?: string;
    latencyMs?: number;
    errorCount?: number;
    hasHighlights?: boolean;
    highlightCount?: number;
  };
  const runId = body.runId || "demo-run";
  const latencyMs = Math.max(0, Number(body.latencyMs) || 0);
  const errorCount = Math.max(0, Number(body.errorCount) || 0);
  const highlightCount = Math.max(0, Number(body.highlightCount) || 0);
  const hasHighlights = typeof body.hasHighlights === "boolean" ? body.hasHighlights : highlightCount > 0;

  const estimatedCostUsd = 0.03 + highlightCount * 0.008;

  const report = evaluatePodcast({
    latencyMs,
    hasHighlights,
    highlightCount,
    estimatedCostUsd,
    errorCount
  });

  return NextResponse.json({
    runId,
    metrics: { latencyMs, errorCount, hasHighlights, highlightCount },
    ...report
  });
}
