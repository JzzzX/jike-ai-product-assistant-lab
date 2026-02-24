import { callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type ClusterRes = {
  clusters: Array<{ label: string; stance: string; evidenceIds: string[] }>;
  disagreements: string[];
  evidenceMap: Record<string, string>;
};

function fallback(comments: Array<{ id: string; text: string }>): ClusterRes {
  return {
    clusters: [
      {
        label: "深度内容派",
        stance: "强调完整表达与长期价值",
        evidenceIds: comments.slice(0, 2).map((item) => item.id)
      },
      {
        label: "传播效率派",
        stance: "强调易传播和触达效率",
        evidenceIds: comments.slice(2, 4).map((item) => item.id)
      }
    ],
    disagreements: ["内容深度与传播效率的优先级排序"],
    evidenceMap: Object.fromEntries(comments.map((item) => [item.id, item.text]))
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { comments?: Array<{ id: string; text: string }>; clusterK?: number };
    const comments = body.comments || [];

    if (comments.length < 2) {
      return NextResponse.json({ error: "at least two comments are required" }, { status: 400 });
    }

    const prompt = [
      "你是社区讨论分析师。",
      "请对评论进行观点聚类，并提取主要分歧。",
      "返回 JSON: clusters, disagreements, evidenceMap",
      JSON.stringify(comments)
    ].join("\n");

    let result = fallback(comments);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<ClusterRes>(output);
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
