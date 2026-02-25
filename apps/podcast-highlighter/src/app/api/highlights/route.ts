import { buildHighlightPrompt, callTextModel, segmentTranscript } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type Segment = { startSec: number; endSec: number; text: string; speaker?: string };
type Highlight = { startSec: number; endSec: number; quote: string; reason: string; score: number };
type ModelHighlight = { startSec?: number; endSec?: number; quote?: string; reason?: string; score?: number };
type CleanModelHighlight = { quote: string; reason: string; score: number };

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"'.，。！？!?:：；;、（）()【】\[\]\-]/g, "")
    .replace(/\s+/g, "");
}

function sanitizeSegments(input: unknown): Segment[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => item as Segment)
    .filter(
      (item) =>
        Number.isFinite(item.startSec) &&
        Number.isFinite(item.endSec) &&
        typeof item.text === "string" &&
        item.text.trim().length > 0
    )
    .map((item) => ({
      startSec: Math.max(0, Math.round(item.startSec)),
      endSec: Math.max(0, Math.round(item.endSec)),
      text: item.text.trim(),
      speaker: item.speaker
    }))
    .sort((a, b) => a.startSec - b.startSec);
}

function resolveFromSegments(segments: Segment[], quote: string, fallbackIndex: number): Pick<Highlight, "startSec" | "endSec"> {
  if (!segments.length) {
    return { startSec: 0, endSec: 0 };
  }

  const normalizedQuote = normalizeText(quote);
  let bestIndex = -1;
  let bestScore = 0;

  if (normalizedQuote) {
    segments.forEach((segment, index) => {
      const normalizedSegment = normalizeText(segment.text);
      if (!normalizedSegment) {
        return;
      }

      let score = 0;
      if (normalizedSegment.includes(normalizedQuote) || normalizedQuote.includes(normalizedSegment)) {
        score += 1000;
      }

      for (const char of normalizedQuote) {
        if (normalizedSegment.includes(char)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
  }

  const selected = segments[bestIndex >= 0 ? bestIndex : Math.min(fallbackIndex, segments.length - 1)];
  return {
    startSec: selected.startSec,
    endSec: selected.endSec
  };
}

function fallbackHighlights(segments: Segment[], maxHighlights: number): Highlight[] {
  const picked = segments.slice(0, maxHighlights);

  return picked.map((segment, idx) => ({
    startSec: segment.startSec,
    endSec: segment.endSec,
    quote: segment.text,
    reason: "启发性内容，适合分享",
    score: clampScore(78 - idx * 3)
  }));
}

function sanitizeModelHighlights(input: ModelHighlight[] | null, baselineSegments: Segment[]): CleanModelHighlight[] {
  if (!input?.length) {
    return [];
  }

  return input
    .map((item, index) => {
      const fallbackQuote = baselineSegments[Math.min(index, Math.max(baselineSegments.length - 1, 0))]?.text || "";
      const score = typeof item.score === "number" && Number.isFinite(item.score) ? item.score : 72;
      return {
        quote: (item.quote || "").trim() || fallbackQuote,
        reason: (item.reason || "").trim() || "提炼关键观点并利于传播",
        score
      };
    })
    .filter((item) => item.quote);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { transcript?: string; segments?: Segment[]; maxHighlights?: number };
    const transcript = (body.transcript || "").trim();
    const maxHighlights = Math.max(1, Math.min(body.maxHighlights || 4, 8));
    const segments = sanitizeSegments(body.segments);
    const baselineSegments = segments.length > 0 ? segments : segmentTranscript(transcript);
    const transcriptText = transcript || baselineSegments.map((segment) => segment.text).join("。");

    if (!transcriptText) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const prompt = buildHighlightPrompt(transcriptText, maxHighlights);

    let highlights = fallbackHighlights(baselineSegments, maxHighlights);
    let source = "fallback";

    if (canUseModel(request)) {
      const modelOutput = await callTextModel(prompt);
      const parsed = parseJsonBlock<ModelHighlight[]>(modelOutput);
      const cleaned = sanitizeModelHighlights(parsed, baselineSegments);
      if (cleaned.length > 0) {
        highlights = cleaned.slice(0, maxHighlights).map((item, index) => ({
          ...resolveFromSegments(baselineSegments, item.quote, index),
          quote: item.quote,
          reason: item.reason,
          score: clampScore(item.score)
        }));
        source = "model";
      }
    }

    return NextResponse.json({ highlights, version: "v1", source });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
