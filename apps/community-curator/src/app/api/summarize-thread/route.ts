import { buildThreadSummaryPrompt, callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type SummarizeRes = {
  summaryShort: string;
  summaryLong: string;
  keyPoints: string[];
};

function fallback(post: string, comments: string[]): SummarizeRes {
  return {
    summaryShort: `讨论核心：${post.slice(0, 36)}...`,
    summaryLong: `主帖围绕“${post}”展开，评论中存在效率优先、深度优先和折中方案三类观点。`,
    keyPoints: comments.slice(0, 3)
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      post?: string;
      comments?: Array<{ id: string; text: string }>;
      mode?: "short" | "long";
    };

    const post = (body.post || "").trim();
    const comments = (body.comments || []).map((item) => item.text).filter(Boolean);

    if (!post || comments.length === 0) {
      return NextResponse.json({ error: "post and comments are required" }, { status: 400 });
    }

    const prompt = buildThreadSummaryPrompt(post, comments);

    let result = fallback(post, comments);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<SummarizeRes>(output);
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
