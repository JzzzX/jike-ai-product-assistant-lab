export type GenericScore = {
  quality?: number;
  speed?: number;
  cost?: number;
  stability?: number;
  compression?: number;
  faithfulness?: number;
  safety?: number;
  usability?: number;
};

function normalize(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function evaluatePodcast(params: {
  latencyMs: number;
  hasHighlights: boolean;
  highlightCount?: number;
  estimatedCostUsd: number;
  errorCount: number;
}): { scores: Required<Pick<GenericScore, "quality" | "speed" | "cost" | "stability">>; notes: string[] } {
  const highlightCount = Math.max(0, Math.round(params.highlightCount || 0));
  const quality = normalize(params.hasHighlights ? 70 + Math.min(highlightCount, 6) * 4 : 35);
  const speed = normalize(100 - params.latencyMs / 120);
  const cost = normalize(100 - params.estimatedCostUsd * 250);
  const stability = normalize(100 - params.errorCount * 20);

  return {
    scores: { quality, speed, cost, stability },
    notes: [
      "Podcast evaluation is heuristic and should be calibrated with human review.",
      "Use consistent sample sets for before/after prompt comparison."
    ]
  };
}

export function evaluateCommunity(params: {
  summaryLength: number;
  hasEvidenceMap: boolean;
  riskFlags?: number;
  replyConfidence?: number;
  flags?: string[];
}): { scores: Required<Pick<GenericScore, "compression" | "faithfulness" | "safety" | "usability">>; notes: string[] } {
  const flagCount = params.flags?.length ?? params.riskFlags ?? 0;
  const replyConfidence = Math.max(0, Math.min(1, params.replyConfidence ?? 0.6));
  const confidenceScore = normalize(replyConfidence * 100);

  const compression = normalize(92 - Math.max(params.summaryLength - 120, 0) / 4);
  const faithfulness = normalize((params.hasEvidenceMap ? 78 : 52) + confidenceScore * 0.15);
  const safety = normalize(100 - flagCount * 12);
  const usability = normalize((compression + faithfulness + confidenceScore) / 3);

  return {
    scores: { compression, faithfulness, safety, usability },
    notes: [
      "Faithfulness requires evidence references to source comments.",
      `Safety flags counted: ${flagCount}.`,
      "Safety score should be validated with manual edge-case checks."
    ]
  };
}
