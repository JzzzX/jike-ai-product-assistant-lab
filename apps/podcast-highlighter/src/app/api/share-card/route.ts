import { buildShareCardPrompt, callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type Highlight = { startSec: number; endSec: number; quote: string; reason: string; score: number };

type ShareCard = {
  headline: string;
  summary: string;
  commentDrafts: string[];
  tags: string[];
};

function fallback(episodeTitle: string, highlights: Highlight[], tone: string): ShareCard {
  const best = highlights[0];
  return {
    headline: `${episodeTitle}｜3分钟听懂核心观点`,
    summary: best ? `${best.quote}（${best.reason}）` : "本期内容讨论了效率与创作。",
    commentDrafts: [
      `我最有共鸣的是：${best?.quote || "内容结构很清晰"}`,
      `这期很适合通勤听，节奏${tone === "理性" ? "克制" : "有感染力"}`,
      "欢迎补充你印象最深的一段。"
    ],
    tags: ["播客", "高光", "内容效率"]
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      episodeTitle?: string;
      highlights?: Highlight[];
      tone?: string;
    };

    const episodeTitle = (body.episodeTitle || "未命名播客").trim();
    const highlights = body.highlights || [];
    const tone = body.tone || "理性";

    const prompt = buildShareCardPrompt(episodeTitle, highlights, tone);

    let result = fallback(episodeTitle, highlights, tone);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<ShareCard>(output);
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
