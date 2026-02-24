"use client";

import { useMemo, useState } from "react";

type Comment = { id: string; text: string };

type SummaryRes = {
  summaryShort?: string;
  summaryLong?: string;
  keyPoints?: string[];
  source?: "fallback" | "model";
};

type ClusterRes = {
  clusters?: Array<{ label: string; stance: string; evidenceIds: string[] }>;
  disagreements?: string[];
  source?: "fallback" | "model";
};

type DraftRes = {
  drafts?: Array<{ tone: string; text: string; riskHint: string }>;
  constraintsApplied?: string[];
  source?: "fallback" | "model";
};

type EvaluateRes = {
  scores?: Record<string, number>;
  notes?: string[];
};

export default function Page() {
  const [post, setPost] = useState("很多人在讨论播客到底该做深内容还是做碎片化传播。");
  const [commentsText, setCommentsText] = useState("我更喜欢深内容。\n碎片化更容易传播。\n关键是找到平衡。\n平台机制决定了内容形态。");
  const [tone, setTone] = useState("友好");
  const [runId, setRunId] = useState("community-demo-run");
  const [demoToken, setDemoToken] = useState("");
  const [loadingAction, setLoadingAction] = useState<"" | "summary" | "cluster" | "draft" | "eval">("");
  const [requestError, setRequestError] = useState("");

  const [summary, setSummary] = useState<SummaryRes | null>(null);
  const [cluster, setCluster] = useState<ClusterRes | null>(null);
  const [drafts, setDrafts] = useState<DraftRes | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluateRes | null>(null);

  const comments = useMemo<Comment[]>(() => {
    return commentsText
      .split("\n")
      .map((text, index) => ({ id: `c-${index + 1}`, text: text.trim() }))
      .filter((item) => item.text);
  }, [commentsText]);

  async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (demoToken.trim()) {
      headers["x-demo-token"] = demoToken.trim();
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = (await res.json()) as T;
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || `request failed: ${res.status}`);
    }
    return data;
  }

  async function summarizeThread() {
    setLoadingAction("summary");
    setRequestError("");
    try {
      const data = await postJson<SummaryRes>("/api/summarize-thread", { post, comments, mode: "long" });
      setSummary(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "summary failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function clusterOpinions() {
    setLoadingAction("cluster");
    setRequestError("");
    try {
      const data = await postJson<ClusterRes>("/api/cluster-opinions", { comments });
      setCluster(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "cluster failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function draftReply() {
    setLoadingAction("draft");
    setRequestError("");
    try {
      const data = await postJson<DraftRes>("/api/reply-draft", {
        targetCluster: "平衡派",
        tone,
        constraints: ["避免攻击性", "引用观点证据"]
      });
      setDrafts(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "draft failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function evaluate() {
    setLoadingAction("eval");
    setRequestError("");
    try {
      const data = await postJson<EvaluateRes>("/api/evaluate", { runId });
      setEvaluation(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "evaluation failed");
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <main className="demo-shell">
      <section className="hero reveal">
        <div>
          <p className="eyebrow">Community Demo</p>
          <h1>社区内容 AI 整理员</h1>
          <p className="hero-sub">验证闭环：帖子输入 → 总结 → 聚类 → 评论草稿 → 评估。支持受控模型调用。</p>
          <div className="hero-tags">
            <span>观点聚类</span>
            <span>证据映射</span>
            <span>风险提示</span>
            <span>source 标记</span>
          </div>
        </div>
        <div className="hero-side">
          <label htmlFor="demo-token">Demo Token (可选)</label>
          <input
            id="demo-token"
            value={demoToken}
            onChange={(e) => setDemoToken(e.target.value)}
            placeholder="用于线上受控访问真实模型"
          />
          <p>评论数量：{comments.length}</p>
          <p>总结来源：{summary?.source || "尚未请求"}</p>
        </div>
      </section>

      {requestError && <p className="error-banner">{requestError}</p>}

      <div className="grid">
        <section className="card reveal delay-1">
          <h2>1. 输入讨论串</h2>
          <textarea rows={4} value={post} onChange={(e) => setPost(e.target.value)} />
          <textarea rows={8} value={commentsText} onChange={(e) => setCommentsText(e.target.value)} style={{ marginTop: 10 }} />
          <button onClick={summarizeThread} disabled={loadingAction !== ""}>
            {loadingAction === "summary" ? "处理中..." : "生成总结"}
          </button>
          {summary?.summaryLong ? (
            <div className="result-card">
              <h3>{summary.summaryShort}</h3>
              <p>{summary.summaryLong}</p>
              <ul>
                {(summary.keyPoints || []).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="meta">source: {summary.source || "unknown"}</p>
            </div>
          ) : (
            <pre>{JSON.stringify(summary, null, 2)}</pre>
          )}
        </section>

        <section className="card reveal delay-2">
          <h2>2. 观点聚类</h2>
          <button className="secondary" onClick={clusterOpinions} disabled={loadingAction !== ""}>
            {loadingAction === "cluster" ? "聚类中..." : "聚类与分歧提炼"}
          </button>
          {cluster?.clusters?.length ? (
            <ul className="cluster-list">
              {cluster.clusters.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong>
                  <p>{item.stance}</p>
                  <span>证据: {item.evidenceIds.join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(cluster, null, 2)}</pre>
          )}
        </section>

        <section className="card reveal delay-3">
          <h2>3. 评论草稿</h2>
          <input value={tone} onChange={(e) => setTone(e.target.value)} />
          <button onClick={draftReply} disabled={loadingAction !== ""}>
            {loadingAction === "draft" ? "生成中..." : "生成多语气草稿"}
          </button>
          {drafts?.drafts?.length ? (
            <ul className="draft-list">
              {drafts.drafts.map((item) => (
                <li key={item.text}>
                  <p className="quote">{item.text}</p>
                  <p className="risk">风险提醒：{item.riskHint}</p>
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(drafts, null, 2)}</pre>
          )}
        </section>

        <section className="card reveal delay-4">
          <h2>4. 评估</h2>
          <input value={runId} onChange={(e) => setRunId(e.target.value)} />
          <button className="secondary" onClick={evaluate} disabled={loadingAction !== ""}>
            {loadingAction === "eval" ? "评估中..." : "生成评估"}
          </button>
          <pre>{JSON.stringify(evaluation, null, 2)}</pre>
        </section>
      </div>
    </main>
  );
}
