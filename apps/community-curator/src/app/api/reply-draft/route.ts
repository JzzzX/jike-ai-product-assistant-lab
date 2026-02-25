import { callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type InputEvidence = { id: string; text: string };
type InputCluster = {
  label: string;
  stance: string;
  evidenceIds?: string[];
  evidence?: InputEvidence[];
};
type InputDisagreement = { topic: string; sides: string[]; evidenceIds: string[] };

type DraftItem = { tone: string; text: string; riskHint: string };
type DraftRes = {
  drafts: DraftItem[];
  constraintsApplied: string[];
  riskHint: string;
};

type RawDraftRes = {
  drafts?: Array<{ tone?: string; text?: string; riskHint?: string }>;
  constraintsApplied?: string[];
  riskHint?: string;
};

function collectEvidence(cluster?: InputCluster, evidenceMap?: Record<string, string>): string[] {
  if (cluster?.evidence?.length) {
    return cluster.evidence.map((item) => item.text).filter(Boolean);
  }

  if (!cluster?.evidenceIds?.length || !evidenceMap) {
    return [];
  }

  return cluster.evidenceIds.map((id) => evidenceMap[id]).filter(Boolean);
}

function fallback(targetCluster: string, tone: string, constraints: string[], evidenceSummary: string): DraftRes {
  const riskHint = constraints.includes("避免攻击性") ? "避免人身判断与绝对化表达" : "避免激化冲突";
  return {
    drafts: [
      {
        tone,
        text: `我理解 ${targetCluster} 的观点。结合“${evidenceSummary}”，或许可以补充一个可执行的中间方案。`,
        riskHint
      },
      {
        tone,
        text: "我们先对齐目标，再讨论是深内容还是碎片化更优，并明确引用讨论证据。",
        riskHint
      }
    ],
    constraintsApplied: constraints,
    riskHint
  };
}

function normalize(
  parsed: RawDraftRes | null,
  defaults: { tone: string; constraints: string[]; riskHint: string }
): DraftRes | null {
  if (!parsed?.drafts?.length) {
    return null;
  }

  const drafts = parsed.drafts
    .filter((item) => item?.text)
    .map((item) => ({
      tone: item.tone || defaults.tone,
      text: item.text || "",
      riskHint: item.riskHint || parsed.riskHint || defaults.riskHint
    }));

  if (!drafts.length) {
    return null;
  }

  const riskHint = parsed.riskHint || drafts[0].riskHint || defaults.riskHint;
  return {
    drafts: drafts.map((item) => ({ ...item, riskHint: item.riskHint || riskHint })),
    constraintsApplied: parsed.constraintsApplied?.length ? parsed.constraintsApplied : defaults.constraints,
    riskHint
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      targetCluster?: string;
      tone?: string;
      constraints?: string[];
      cluster?: InputCluster;
      evidenceMap?: Record<string, string>;
      disagreements?: InputDisagreement[];
    };

    const targetCluster = body.targetCluster || body.cluster?.label || "平衡派";
    const tone = body.tone || "友好";
    const constraints = body.constraints?.length ? body.constraints : ["避免攻击性"];
    const evidence = collectEvidence(body.cluster, body.evidenceMap);
    const evidenceSummary = evidence.slice(0, 2).join("；") || "未提供明确证据";
    const disagreementSummary = (body.disagreements || [])
      .slice(0, 2)
      .map((item) => item.topic)
      .join("；");

    const prompt = [
      "你是社区互动助手。",
      "请根据给定语气生成可发布评论草稿。",
      `目标观点簇: ${targetCluster}`,
      `观点立场: ${body.cluster?.stance || "未提供"}`,
      `证据摘要: ${evidenceSummary}`,
      `核心分歧: ${disagreementSummary || "未提供"}`,
      `语气: ${tone}`,
      `约束: ${constraints.join("、")}`,
      "返回 JSON: drafts[{tone,text,riskHint}], constraintsApplied, riskHint"
    ].join("\n");

    let result = fallback(targetCluster, tone, constraints, evidenceSummary);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<RawDraftRes>(output);
      const normalized = normalize(parsed, { tone, constraints, riskHint: result.riskHint });
      if (normalized) {
        result = normalized;
        source = "model";
      }
    }

    return NextResponse.json({ ...result, source });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
