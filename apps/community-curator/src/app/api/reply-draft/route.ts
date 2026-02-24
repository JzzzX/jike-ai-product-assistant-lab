import { callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type DraftRes = {
  drafts: Array<{ tone: string; text: string; riskHint: string }>;
  constraintsApplied: string[];
};

function fallback(targetCluster: string, tone: string, constraints: string[]): DraftRes {
  return {
    drafts: [
      {
        tone,
        text: `我理解 ${targetCluster} 的观点，或许可以补充一个可执行的中间方案。`,
        riskHint: "避免绝对化表达"
      },
      {
        tone,
        text: "我们先对齐目标，再讨论是深内容还是碎片化更优。",
        riskHint: "避免人身判断"
      }
    ],
    constraintsApplied: constraints
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      targetCluster?: string;
      tone?: string;
      constraints?: string[];
    };

    const targetCluster = body.targetCluster || "平衡派";
    const tone = body.tone || "友好";
    const constraints = body.constraints || ["避免攻击性"];

    const prompt = [
      "你是社区互动助手。",
      "请根据给定语气生成可发布评论草稿。",
      `目标观点簇: ${targetCluster}`,
      `语气: ${tone}`,
      `约束: ${constraints.join("、")}`,
      "返回 JSON: drafts, constraintsApplied"
    ].join("\n");

    let result = fallback(targetCluster, tone, constraints);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<DraftRes>(output);
      if (parsed) {
        result = parsed;
        source = "model";
      }
    }

    return NextResponse.json({ ...result, source });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
