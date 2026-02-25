import { evaluateCommunity } from "@repo/eval-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function sanitizeRunId(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80) || "community-demo-run";
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
    summaryLength?: number;
    summary?: { text?: string; mode?: "short" | "long" };
    replyConfidence?: number;
    flags?: string[];
    cluster?: { evidenceMap?: Record<string, string> };
    draft?: { constraintsApplied?: string[]; riskHint?: string };
  };
  const runId = body.runId || "community-demo-run";
  const summaryLength = typeof body.summaryLength === "number" ? Math.max(0, Math.round(body.summaryLength)) : (body.summary?.text || "").length;
  const hasEvidenceMap = Boolean(body.cluster?.evidenceMap && Object.keys(body.cluster.evidenceMap).length > 0);
  const rawConfidence = typeof body.replyConfidence === "number" ? body.replyConfidence : 0.6;
  const replyConfidence = rawConfidence > 1 ? Math.min(rawConfidence / 100, 1) : Math.max(0, Math.min(1, rawConfidence));

  const inferredFlags: string[] = [];
  if (!summaryLength) {
    inferredFlags.push("missing-summary");
  }
  if (!hasEvidenceMap) {
    inferredFlags.push("missing-evidence");
  }
  if (!body.draft?.constraintsApplied?.length) {
    inferredFlags.push("missing-constraints");
  }
  if (replyConfidence < 0.4) {
    inferredFlags.push("low-reply-confidence");
  }
  if (body.draft?.riskHint) {
    inferredFlags.push("has-risk-hint");
  }

  const flags = [...new Set([...(body.flags || []), ...inferredFlags].filter(Boolean))];

  const report = evaluateCommunity({
    summaryLength,
    hasEvidenceMap,
    replyConfidence,
    flags
  });

  const responsePayload = {
    runId,
    inputUsed: { summaryLength, replyConfidence, flags, hasEvidenceMap, mode: body.summary?.mode || "long" },
    ...report
  };
  const savedRunPath = await saveRunReport(runId, {
    savedAt: new Date().toISOString(),
    app: "community-curator",
    ...responsePayload
  });

  return NextResponse.json({
    ...responsePayload,
    savedRunPath
  });
}
