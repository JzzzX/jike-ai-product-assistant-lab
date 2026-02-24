import { readFile, writeFile, mkdir } from "node:fs/promises";

const podcastBase = process.env.PODCAST_BASE_URL || "http://127.0.0.1:3001";
const communityBase = process.env.COMMUNITY_BASE_URL || "http://127.0.0.1:3002";

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${url} failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function runPodcastEval(samples) {
  const highlightScores = [];
  const evalQuality = [];
  const evalSpeed = [];
  const evalCost = [];
  const evalStability = [];

  for (const item of samples) {
    const transcribe = await postJson(`${podcastBase}/api/transcribe`, {
      transcript: item.transcript
    });

    const highlights = await postJson(`${podcastBase}/api/highlights`, {
      transcript: transcribe.transcript,
      maxHighlights: 2
    });

    const shareCard = await postJson(`${podcastBase}/api/share-card`, {
      episodeTitle: item.title,
      highlights: highlights.highlights || [],
      tone: "理性"
    });

    const evalRes = await postJson(`${podcastBase}/api/evaluate`, {
      runId: `podcast-${item.id}`
    });

    if (highlights.highlights?.[0]?.score != null) {
      highlightScores.push(Number(highlights.highlights[0].score));
    }

    evalQuality.push(evalRes.scores?.quality ?? 0);
    evalSpeed.push(evalRes.scores?.speed ?? 0);
    evalCost.push(evalRes.scores?.cost ?? 0);
    evalStability.push(evalRes.scores?.stability ?? 0);

    if (!shareCard.headline || !shareCard.summary) {
      throw new Error(`share-card output invalid for ${item.id}`);
    }
  }

  return {
    sampleCount: samples.length,
    avgHighlightScore: Number(avg(highlightScores).toFixed(2)),
    avgQuality: Number(avg(evalQuality).toFixed(2)),
    avgSpeed: Number(avg(evalSpeed).toFixed(2)),
    avgCost: Number(avg(evalCost).toFixed(2)),
    avgStability: Number(avg(evalStability).toFixed(2))
  };
}

async function runCommunityEval(threads) {
  const compression = [];
  const faithfulness = [];
  const safety = [];
  const usability = [];

  for (const item of threads) {
    const comments = item.comments.map((text, index) => ({
      id: `${item.id}-c${index + 1}`,
      text
    }));

    const sum = await postJson(`${communityBase}/api/summarize-thread`, {
      post: item.post,
      comments,
      mode: "long"
    });

    const cluster = await postJson(`${communityBase}/api/cluster-opinions`, {
      comments
    });

    const draft = await postJson(`${communityBase}/api/reply-draft`, {
      targetCluster: "平衡派",
      tone: "友好",
      constraints: ["避免攻击性", "引用观点证据"]
    });

    const evalRes = await postJson(`${communityBase}/api/evaluate`, {
      runId: `community-${item.id}`
    });

    if (!sum.summaryShort || !cluster.clusters?.length || !draft.drafts?.length) {
      throw new Error(`community pipeline invalid for ${item.id}`);
    }

    compression.push(evalRes.scores?.compression ?? 0);
    faithfulness.push(evalRes.scores?.faithfulness ?? 0);
    safety.push(evalRes.scores?.safety ?? 0);
    usability.push(evalRes.scores?.usability ?? 0);
  }

  return {
    sampleCount: threads.length,
    avgCompression: Number(avg(compression).toFixed(2)),
    avgFaithfulness: Number(avg(faithfulness).toFixed(2)),
    avgSafety: Number(avg(safety).toFixed(2)),
    avgUsability: Number(avg(usability).toFixed(2))
  };
}

async function main() {
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const podcastRaw = await readFile("data/podcast-samples/podcast_samples.json", "utf8");
  const communityRaw = await readFile("data/community-samples/community_threads.json", "utf8");
  const podcastSamples = JSON.parse(podcastRaw);
  const communityThreads = JSON.parse(communityRaw);

  const podcastMetrics = await runPodcastEval(podcastSamples);
  const communityMetrics = await runCommunityEval(communityThreads);

  const report = {
    generatedAt: ts,
    podcastBase,
    communityBase,
    podcast: podcastMetrics,
    community: communityMetrics,
    note: "Current metrics are based on fallback logic + heuristic evaluate endpoints."
  };

  await mkdir("reports", { recursive: true });
  await writeFile("reports/sample_eval_report.json", JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# 样本批量评估报告",
    "",
    `生成时间：${ts}`,
    "",
    "## 播客项目",
    `- 样本数：${podcastMetrics.sampleCount}`,
    `- 平均高光分：${podcastMetrics.avgHighlightScore}`,
    `- 平均质量分：${podcastMetrics.avgQuality}`,
    `- 平均速度分：${podcastMetrics.avgSpeed}`,
    `- 平均成本分：${podcastMetrics.avgCost}`,
    `- 平均稳定性分：${podcastMetrics.avgStability}`,
    "",
    "## 社区项目",
    `- 样本数：${communityMetrics.sampleCount}`,
    `- 平均压缩分：${communityMetrics.avgCompression}`,
    `- 平均忠实度分：${communityMetrics.avgFaithfulness}`,
    `- 平均安全分：${communityMetrics.avgSafety}`,
    `- 平均可用性分：${communityMetrics.avgUsability}`,
    "",
    "## 说明",
    "- 当前评分来自启发式评估接口，下一步应叠加人工标注验证。",
    "- 该报告可直接用于面试中展示“样本规模 + 指标口径 + 迭代方向”。"
  ].join("\n");

  await writeFile("reports/sample_eval_report.md", md, "utf8");
  console.log("Sample evaluation report generated:");
  console.log("- reports/sample_eval_report.json");
  console.log("- reports/sample_eval_report.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
