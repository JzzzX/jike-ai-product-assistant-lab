import type { Highlight, Segment } from "./types";

export function buildHighlightPrompt(transcript: string, maxHighlights: number): string {
  return [
    "你是播客内容编辑。",
    `请从以下转写中提取 ${maxHighlights} 个高光片段，返回 JSON 数组，每项包含 quote、reason、score。`,
    "score 为 0-100，reason 要简洁。",
    "--- transcript ---",
    transcript
  ].join("\n");
}

export function buildShareCardPrompt(episodeTitle: string, highlights: Highlight[], tone: string): string {
  return [
    "你是内容运营编辑。",
    `请基于高光片段生成分享文案。语气：${tone}`,
    `播客标题：${episodeTitle}`,
    `高光：${JSON.stringify(highlights)}`,
    "返回 JSON，包含 headline、summary、commentDrafts(3条)、tags(最多5个)。"
  ].join("\n");
}

export function buildThreadSummaryPrompt(post: string, comments: string[]): string {
  return [
    "你是社区内容分析助手。",
    "请生成速读总结和深读总结，并提取关键观点。",
    `主帖：${post}`,
    `评论：${comments.join("\n")}`,
    "返回 JSON: summaryShort, summaryLong, keyPoints"
  ].join("\n");
}

export function segmentTranscript(transcript: string): Segment[] {
  const lines = transcript
    .split(/[\n。！？]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines.slice(0, 50).map((text, index) => ({
    startSec: index * 10,
    endSec: index * 10 + 9,
    text
  }));
}
