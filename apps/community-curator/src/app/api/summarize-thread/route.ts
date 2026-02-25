import { buildThreadSummaryPrompt, callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type SummaryMode = "short" | "long";

type RawSummarizeRes = {
  summaryShort: string;
  summaryLong: string;
  keyPoints: string[];
};

type SummarizeRes = RawSummarizeRes & {
  summary: string;
  usedMode: SummaryMode;
};

function fallback(post: string, comments: string[], mode: SummaryMode): RawSummarizeRes {
  const short = `讨论核心：${post.slice(0, 28)}${post.length > 28 ? "..." : ""}`;
  const long =
    mode === "short"
      ? `${short} 主分歧集中在“效率 vs 深度”。`
      : `主帖围绕“${post}”展开，评论中存在效率优先、深度优先和折中方案三类观点。`;
  return {
    summaryShort: short,
    summaryLong: long,
    keyPoints: comments.slice(0, 3)
  };
}

function finalize(raw: RawSummarizeRes, mode: SummaryMode): SummarizeRes {
  const summaryShort = raw.summaryShort.trim();
  const summaryLong = raw.summaryLong.trim();
  return {
    ...raw,
    summaryShort,
    summaryLong,
    summary: mode === "short" ? summaryShort : summaryLong,
    usedMode: mode
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      post?: string;
      comments?: Array<{ id: string; text: string }>;
      mode?: SummaryMode;
    };

    const post = (body.post || "").trim();
    const comments = (body.comments || []).map((item) => item.text).filter(Boolean);
    const mode: SummaryMode = body.mode === "short" ? "short" : "long";

    if (!post || comments.length === 0) {
      return NextResponse.json({ error: "post and comments are required" }, { status: 400 });
    }

    const prompt = buildThreadSummaryPrompt(post, comments, mode);

    const base = fallback(post, comments, mode);
    let result = finalize(base, mode);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<RawSummarizeRes>(output);
      if (parsed?.summaryShort && parsed?.summaryLong && Array.isArray(parsed?.keyPoints)) {
        result = finalize(parsed, mode);
        source = "model";
      }
    }

    return NextResponse.json({ ...result, source });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
