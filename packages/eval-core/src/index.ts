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
  estimatedCostUsd: number;
  errorCount: number;
}): { scores: Required<Pick<GenericScore, "quality" | "speed" | "cost" | "stability">>; notes: string[] } {
  const quality = normalize(params.hasHighlights ? 85 : 35);
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
  riskFlags: number;
}): { scores: Required<Pick<GenericScore, "compression" | "faithfulness" | "safety" | "usability">>; notes: string[] } {
  const compression = normalize(80 + Math.min(params.summaryLength, 20));
  const faithfulness = normalize(params.hasEvidenceMap ? 88 : 55);
  const safety = normalize(100 - params.riskFlags * 15);
  const usability = normalize((compression + faithfulness) / 2);

  return {
    scores: { compression, faithfulness, safety, usability },
    notes: [
      "Faithfulness requires evidence references to source comments.",
      "Safety score should be validated with manual edge-case checks."
    ]
  };
}
