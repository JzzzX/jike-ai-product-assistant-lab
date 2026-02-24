import { buildHighlightPrompt, callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type Highlight = { startSec: number; endSec: number; quote: string; reason: string; score: number };

function fallbackHighlights(transcript: string, maxHighlights: number): Highlight[] {
  const chunks = transcript
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxHighlights);

  return chunks.map((quote, idx) => ({
    startSec: idx * 20,
    endSec: idx * 20 + 18,
    quote,
    reason: "启发性内容，适合分享",
    score: 78 - idx * 3
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: string; maxHighlights?: number };
    const transcript = (body.transcript || "").trim();
    const maxHighlights = Math.max(1, Math.min(body.maxHighlights || 4, 8));

    if (!transcript) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const prompt = buildHighlightPrompt(transcript, maxHighlights);

    let highlights = fallbackHighlights(transcript, maxHighlights);
    let source = "fallback";

    if (canUseModel(request)) {
      const modelOutput = await callTextModel(prompt);
      const parsed = parseJsonBlock<Array<{ quote: string; reason: string; score: number }>>(modelOutput);
      if (parsed && parsed.length > 0) {
        highlights = parsed.slice(0, maxHighlights).map((item, index) => ({
          startSec: index * 20,
          endSec: index * 20 + 18,
          quote: item.quote,
          reason: item.reason,
          score: item.score
        }));
        source = "model";
      }
    }

    return NextResponse.json({ highlights, version: "v1", source });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
