import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const rootDir = process.cwd();
const podcastBase = process.env.PODCAST_BASE_URL || "http://127.0.0.1:3001";
const communityBase = process.env.COMMUNITY_BASE_URL || "http://127.0.0.1:3002";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${url} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function startServer(label, appDir, port, logFile) {
  const child = spawn("pnpm", ["-C", appDir, "dev"], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const logChunks = [];
  child.stdout.on("data", (chunk) => logChunks.push(`[stdout] ${chunk.toString()}`));
  child.stderr.on("data", (chunk) => logChunks.push(`[stderr] ${chunk.toString()}`));

  const flushLogs = async () => {
    await mkdir(path.dirname(logFile), { recursive: true });
    await writeFile(logFile, logChunks.join(""), "utf8");
  };

  child.on("exit", () => {
    flushLogs().catch(() => undefined);
  });

  return {
    label,
    child,
    flushLogs
  };
}

async function waitForHttp(url, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) {
        return;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function runPodcastSmoke() {
  const runId = `smoke-podcast-${Date.now()}`;
  const transcribe = await postJson(`${podcastBase}/api/transcribe`, {
    transcript: "我们这期先讲清楚目标，再讲执行路径。"
  });
  if (!transcribe.transcript || !transcribe.segments?.length) {
    throw new Error("podcast transcribe output invalid");
  }

  const highlights = await postJson(`${podcastBase}/api/highlights`, {
    transcript: transcribe.transcript,
    segments: transcribe.segments,
    maxHighlights: 2
  });
  if (!highlights.highlights?.length) {
    throw new Error("podcast highlights output invalid");
  }

  const share = await postJson(`${podcastBase}/api/share-card`, {
    episodeTitle: "Smoke Podcast",
    highlights: highlights.highlights,
    tone: "理性"
  });
  if (!share.headline || !share.summary) {
    throw new Error("podcast share output invalid");
  }

  const evaluation = await postJson(`${podcastBase}/api/evaluate`, {
    runId,
    latencyMs: 1200,
    errorCount: 0,
    hasHighlights: true,
    highlightCount: highlights.highlights.length
  });
  if (!evaluation.scores?.quality || !evaluation.savedRunPath) {
    throw new Error("podcast evaluation output invalid");
  }
  await access(evaluation.savedRunPath);
  return { runId, savedRunPath: evaluation.savedRunPath };
}

async function runCommunitySmoke() {
  const runId = `smoke-community-${Date.now()}`;
  const comments = [
    { id: "c-1", text: "深度内容更能建立长期信任。" },
    { id: "c-2", text: "碎片化传播更适合拉新触达。" },
    { id: "c-3", text: "可以先短后长，先触达再沉淀。" }
  ];

  const summary = await postJson(`${communityBase}/api/summarize-thread`, {
    post: "讨论播客内容深度与传播效率的取舍。",
    comments,
    mode: "long"
  });
  if (!summary.summaryLong) {
    throw new Error("community summary output invalid");
  }

  const cluster = await postJson(`${communityBase}/api/cluster-opinions`, {
    comments,
    clusterK: 3
  });
  if (!cluster.clusters?.length || !cluster.evidenceMap) {
    throw new Error("community cluster output invalid");
  }

  const draft = await postJson(`${communityBase}/api/reply-draft`, {
    targetCluster: cluster.clusters[0].label,
    cluster: cluster.clusters[0],
    evidenceMap: cluster.evidenceMap,
    disagreements: cluster.disagreements,
    tone: "友好",
    constraints: ["避免攻击性", "引用观点证据"]
  });
  if (!draft.drafts?.length || !draft.constraintsApplied?.length) {
    throw new Error("community draft output invalid");
  }

  const evaluation = await postJson(`${communityBase}/api/evaluate`, {
    runId,
    summary: { text: summary.summaryLong, mode: "long" },
    summaryLength: summary.summaryLong.length,
    replyConfidence: 0.7,
    flags: [],
    cluster: { evidenceMap: cluster.evidenceMap },
    draft: { constraintsApplied: draft.constraintsApplied, riskHint: draft.riskHint || draft.drafts?.[0]?.riskHint }
  });
  if (!evaluation.scores?.faithfulness || !evaluation.savedRunPath) {
    throw new Error("community evaluation output invalid");
  }
  await access(evaluation.savedRunPath);
  return { runId, savedRunPath: evaluation.savedRunPath };
}

async function main() {
  const podcastLog = path.resolve(rootDir, "reports", "logs", "podcast-dev.log");
  const communityLog = path.resolve(rootDir, "reports", "logs", "community-dev.log");
  const podcast = startServer("podcast", "apps/podcast-highlighter", 3001, podcastLog);
  const community = startServer("community", "apps/community-curator", 3002, communityLog);

  try {
    await waitForHttp(podcastBase);
    await waitForHttp(communityBase);

    const podcastResult = await runPodcastSmoke();
    const communityResult = await runCommunitySmoke();

    console.log("Smoke checks passed.");
    console.log(JSON.stringify({ podcast: podcastResult, community: communityResult }, null, 2));
  } finally {
    podcast.child.kill("SIGTERM");
    community.child.kill("SIGTERM");
    await Promise.all([podcast.flushLogs(), community.flushLogs()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
