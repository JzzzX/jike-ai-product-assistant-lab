import { evaluatePodcast } from "@repo/eval-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function sanitizeRunId(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80) || "demo-run";
}

async function saveRunReport(runId: string, payload: unknown): Promise<string> {
  const safeRunId = sanitizeRunId(runId);
  const dir = path.resolve(process.cwd(), "evaluation", "runs");
  await mkdir(dir, { recursive: true });
  const targetPath = path.join(dir, `${safeRunId}.json`);
  await writeFile(targetPath, JSON.stringify(payload, null, 2), "utf8");
  return targetPath;
}

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

  const responsePayload = {
    runId,
    metrics: { latencyMs, errorCount, hasHighlights, highlightCount },
    ...report
  };
  const savedRunPath = await saveRunReport(runId, {
    savedAt: new Date().toISOString(),
    app: "podcast-highlighter",
    ...responsePayload
  });

  return NextResponse.json({
    ...responsePayload,
    savedRunPath
  });
}
