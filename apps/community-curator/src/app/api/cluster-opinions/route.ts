import { callTextModel } from "@repo/ai-core";
import { NextResponse } from "next/server";

import { canUseModel } from "../../../lib/demo-auth";
import { parseJsonBlock } from "../../../lib/json";

type Evidence = { id: string; text: string };
type Disagreement = { topic: string; sides: string[]; evidenceIds: string[] };

type ClusterRes = {
  clusters: Array<{ label: string; stance: string; evidenceIds: string[]; evidence: Evidence[] }>;
  disagreements: Disagreement[];
  evidenceMap: Record<string, string>;
};

type RawClusterRes = {
  clusters?: Array<{ label?: string; stance?: string; evidenceIds?: string[]; evidence?: Evidence[] }>;
  disagreements?: Array<string | Disagreement>;
  evidenceMap?: Record<string, string>;
};

function buildEvidenceMap(comments: Array<{ id: string; text: string }>, extra?: Record<string, string>): Record<string, string> {
  return { ...Object.fromEntries(comments.map((item) => [item.id, item.text])), ...(extra || {}) };
}

function toEvidence(evidenceIds: string[], evidenceMap: Record<string, string>, rawEvidence?: Evidence[]): Evidence[] {
  if (rawEvidence?.length) {
    return rawEvidence
      .filter((item) => item?.id && item?.text)
      .map((item) => ({ id: item.id, text: item.text.trim() }));
  }
  return evidenceIds.map((id) => ({ id, text: evidenceMap[id] || "" })).filter((item) => item.text);
}

function clampClusterK(clusterK: number | undefined, commentsCount: number): number {
  return Math.max(2, Math.min(4, Math.min(commentsCount, Math.round(clusterK || 2))));
}

function fallback(comments: Array<{ id: string; text: string }>, clusterK: number): ClusterRes {
  const evidenceMap = buildEvidenceMap(comments);
  const presets = [
    { label: "深度内容派", stance: "强调完整表达与长期价值" },
    { label: "传播效率派", stance: "强调易传播和触达效率" },
    { label: "平衡落地派", stance: "强调节奏、成本与落地平衡" },
    { label: "平台机制派", stance: "强调平台分发机制对内容形态的影响" }
  ];

  const groups = Array.from({ length: clusterK }, () => [] as string[]);
  comments.forEach((item, index) => {
    groups[index % clusterK].push(item.id);
  });

  const clusters = groups.map((evidenceIds, index) => {
    const preset = presets[index] || { label: `观点簇${index + 1}`, stance: "侧重不同讨论重点" };
    return {
      label: preset.label,
      stance: preset.stance,
      evidenceIds,
      evidence: toEvidence(evidenceIds, evidenceMap)
    };
  });

  return {
    clusters,
    disagreements: [
      {
        topic: "内容深度与传播效率的优先级排序",
        sides: clusters.map((item) => item.label).slice(0, Math.max(2, Math.min(3, clusters.length))),
        evidenceIds: clusters.flatMap((item) => item.evidenceIds).slice(0, 6)
      }
    ],
    evidenceMap
  };
}

function normalize(raw: RawClusterRes, comments: Array<{ id: string; text: string }>, clusterK: number): ClusterRes | null {
  if (!Array.isArray(raw.clusters) || raw.clusters.length === 0) {
    return null;
  }

  const evidenceMap = buildEvidenceMap(comments, raw.evidenceMap);
  const clusters = raw.clusters
    .filter((item) => item?.label && item?.stance)
    .map((item) => {
      const evidenceIds = (item.evidenceIds || []).filter(Boolean);
      return {
        label: item.label as string,
        stance: item.stance as string,
        evidenceIds,
        evidence: toEvidence(evidenceIds, evidenceMap, item.evidence)
      };
    })
    .slice(0, clusterK);

  if (clusters.length === 0) {
    return null;
  }

  const disagreements =
    raw.disagreements?.map((item) => {
      if (typeof item === "string") {
        return {
          topic: item,
          sides: clusters.map((cluster) => cluster.label).slice(0, 2),
          evidenceIds: clusters.flatMap((cluster) => cluster.evidenceIds).slice(0, 4)
        };
      }
      return {
        topic: item.topic || "主要分歧",
        sides: item.sides || clusters.map((cluster) => cluster.label).slice(0, 2),
        evidenceIds: item.evidenceIds || clusters.flatMap((cluster) => cluster.evidenceIds).slice(0, 4)
      };
    }) || [];

  return {
    clusters,
    disagreements,
    evidenceMap
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { comments?: Array<{ id: string; text: string }>; clusterK?: number };
    const comments = body.comments || [];
    const clusterK = clampClusterK(body.clusterK, comments.length);

    if (comments.length < 2) {
      return NextResponse.json({ error: "at least two comments are required" }, { status: 400 });
    }

    const prompt = [
      "你是社区讨论分析师。",
      `请对评论进行观点聚类（建议 ${clusterK} 类），并提取主要分歧。`,
      "返回 JSON: clusters[{label,stance,evidenceIds,evidence}], disagreements[{topic,sides,evidenceIds}], evidenceMap",
      JSON.stringify(comments)
    ].join("\n");

    let result = fallback(comments, clusterK);
    let source = "fallback";

    if (canUseModel(request)) {
      const output = await callTextModel(prompt);
      const parsed = parseJsonBlock<RawClusterRes>(output);
      const normalized = parsed ? normalize(parsed, comments, clusterK) : null;
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
