"use client";

import { useMemo, useState } from "react";

type Comment = { id: string; text: string };
type SummaryMode = "short" | "long";

type SummaryRes = {
  summaryShort?: string;
  summaryLong?: string;
  summary?: string;
  usedMode?: SummaryMode;
  keyPoints?: string[];
  source?: "fallback" | "model";
};

type ClusterEvidence = { id: string; text: string };
type ClusterItem = { label: string; stance: string; evidenceIds: string[]; evidence?: ClusterEvidence[] };
type ClusterDisagreement = { topic: string; sides: string[]; evidenceIds: string[] };

type ClusterRes = {
  clusters?: ClusterItem[];
  disagreements?: ClusterDisagreement[];
  evidenceMap?: Record<string, string>;
  source?: "fallback" | "model";
};

type DraftRes = {
  drafts?: Array<{ tone: string; text: string; riskHint: string }>;
  constraintsApplied?: string[];
  riskHint?: string;
  source?: "fallback" | "model";
};

type EvaluateRes = {
  runId?: string;
  savedRunPath?: string;
  scores?: Record<string, number>;
  notes?: string[];
  inputUsed?: {
    summaryLength?: number;
    replyConfidence?: number;
    flags?: string[];
    hasEvidenceMap?: boolean;
    mode?: SummaryMode;
  };
};

export default function Page() {
  const [post, setPost] = useState("很多人在讨论播客到底该做深内容还是做碎片化传播。");
  const [commentsText, setCommentsText] = useState("我更喜欢深内容。\n碎片化更容易传播。\n关键是找到平衡。\n平台机制决定了内容形态。");
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("long");
  const [clusterK, setClusterK] = useState(2);
  const [targetCluster, setTargetCluster] = useState("平衡派");
  const [tone, setTone] = useState("友好");
  const [constraintsText, setConstraintsText] = useState("避免攻击性\n引用观点证据");
  const [replyConfidence, setReplyConfidence] = useState(0.72);
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

  const selectedCluster = useMemo(() => {
    if (!cluster?.clusters?.length) {
      return null;
    }
    return cluster.clusters.find((item) => item.label === targetCluster) || cluster.clusters[0];
  }, [cluster, targetCluster]);

  const displayedSummary = useMemo(() => {
    if (!summary) {
      return "";
    }
    if (summaryMode === "short") {
      return summary.summaryShort || summary.summary || "";
    }
    return summary.summaryLong || summary.summary || "";
  }, [summary, summaryMode]);

  const constraints = useMemo(
    () =>
      constraintsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [constraintsText]
  );
  const summarySourceLabel =
    summary?.source === "model" ? "模型" : summary?.source === "fallback" ? "回退" : "尚未请求";

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
      throw new Error((data as { error?: string }).error || `请求失败：${res.status}`);
    }
    return data;
  }

  async function summarizeThread() {
    setLoadingAction("summary");
    setRequestError("");
    try {
      const data = await postJson<SummaryRes>("/api/summarize-thread", { post, comments, mode: summaryMode });
      setSummary(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "总结生成失败");
    } finally {
      setLoadingAction("");
    }
  }

  async function clusterOpinions() {
    setLoadingAction("cluster");
    setRequestError("");
    try {
      const data = await postJson<ClusterRes>("/api/cluster-opinions", { comments, clusterK });
      setCluster(data);
      const clusters = data.clusters || [];
      if (clusters.length) {
        setTargetCluster((prev) => (clusters.some((item) => item.label === prev) ? prev : clusters[0].label));
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "聚类生成失败");
    } finally {
      setLoadingAction("");
    }
  }

  async function draftReply() {
    setLoadingAction("draft");
    setRequestError("");
    if (!constraints.length) {
      setRequestError("至少提供一条约束");
      setLoadingAction("");
      return;
    }
    try {
      const data = await postJson<DraftRes>("/api/reply-draft", {
        targetCluster: selectedCluster?.label || targetCluster,
        cluster: selectedCluster,
        evidenceMap: cluster?.evidenceMap,
        disagreements: cluster?.disagreements,
        tone,
        constraints
      });
      setDrafts(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "草稿生成失败");
    } finally {
      setLoadingAction("");
    }
  }

  async function runFullFlow() {
    setRequestError("");
    try {
      setLoadingAction("summary");
      const summaryData = await postJson<SummaryRes>("/api/summarize-thread", { post, comments, mode: summaryMode });
      setSummary(summaryData);

      setLoadingAction("cluster");
      const clusterData = await postJson<ClusterRes>("/api/cluster-opinions", { comments, clusterK });
      setCluster(clusterData);
      const availableClusters = clusterData.clusters || [];
      const chosenCluster = availableClusters.find((item) => item.label === targetCluster) || availableClusters[0] || null;
      if (chosenCluster) {
        setTargetCluster(chosenCluster.label);
      }

      if (!constraints.length) {
        throw new Error("至少提供一条约束");
      }

      setLoadingAction("draft");
      const draftData = await postJson<DraftRes>("/api/reply-draft", {
        targetCluster: chosenCluster?.label || targetCluster,
        cluster: chosenCluster || undefined,
        evidenceMap: clusterData.evidenceMap,
        disagreements: clusterData.disagreements,
        tone,
        constraints
      });
      setDrafts(draftData);

      const flags = [
        summaryData.source === "fallback" ? "summary-fallback" : "",
        clusterData.source === "fallback" ? "cluster-fallback" : "",
        draftData.source === "fallback" ? "draft-fallback" : "",
        !draftData.constraintsApplied?.length ? "constraints-missing" : ""
      ].filter(Boolean);

      setLoadingAction("eval");
      const summaryText = summaryMode === "short" ? summaryData.summaryShort || "" : summaryData.summaryLong || "";
      const evaluationData = await postJson<EvaluateRes>("/api/evaluate", {
        runId,
        summary: { text: summaryText, mode: summaryMode },
        summaryLength: summaryText.length,
        replyConfidence,
        flags,
        cluster: { evidenceMap: clusterData.evidenceMap },
        draft: { constraintsApplied: draftData.constraintsApplied, riskHint: draftData.riskHint || draftData.drafts?.[0]?.riskHint }
      });
      setEvaluation(evaluationData);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "完整流程执行失败");
    } finally {
      setLoadingAction("");
    }
  }

  async function evaluate() {
    setLoadingAction("eval");
    setRequestError("");
    try {
      const flags = [
        summary?.source === "fallback" ? "summary-fallback" : "",
        cluster?.source === "fallback" ? "cluster-fallback" : "",
        drafts?.source === "fallback" ? "draft-fallback" : "",
        !drafts?.constraintsApplied?.length ? "constraints-missing" : ""
      ].filter(Boolean);

      const data = await postJson<EvaluateRes>("/api/evaluate", {
        runId,
        summary: { text: displayedSummary, mode: summaryMode },
        summaryLength: displayedSummary.length,
        replyConfidence,
        flags,
        cluster: { evidenceMap: cluster?.evidenceMap },
        draft: { constraintsApplied: drafts?.constraintsApplied, riskHint: drafts?.riskHint || drafts?.drafts?.[0]?.riskHint }
      });
      setEvaluation(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "评估生成失败");
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <main className="demo-shell">
      <section className="hero reveal">
        <div>
          <p className="eyebrow">社区演示</p>
          <h1>社区内容 AI 整理员</h1>
          <p className="hero-sub">把长讨论串变成可执行结论：总结、聚类、草稿、评估四步闭环。</p>
          <div className="hero-tags">
            <span>观点聚类</span>
            <span>证据映射</span>
            <span>风险提示</span>
            <span>来源标记</span>
          </div>
        </div>
        <div className="hero-side">
          <label htmlFor="demo-token">访问令牌（可选）</label>
          <input
            id="demo-token"
            value={demoToken}
            onChange={(e) => setDemoToken(e.target.value)}
            placeholder="用于线上受控访问真实模型"
          />
          <p>评论数量：{comments.length}</p>
          <p>总结来源：{summarySourceLabel}</p>
          <button className="secondary" onClick={runFullFlow} disabled={loadingAction !== ""}>
            {loadingAction ? "执行中..." : "一键跑完整流程"}
          </button>
        </div>
      </section>

      {requestError && <p className="error-banner">{requestError}</p>}

      <div className="grid">
        <section className="card reveal delay-1">
          <h2>1. 输入讨论串</h2>
          <label htmlFor="post-input">主题正文</label>
          <textarea id="post-input" rows={4} value={post} onChange={(e) => setPost(e.target.value)} />
          <label htmlFor="comments-input">评论列表（每行一条）</label>
          <textarea id="comments-input" rows={8} value={commentsText} onChange={(e) => setCommentsText(e.target.value)} />
          <label htmlFor="summary-mode">总结模式</label>
          <select id="summary-mode" value={summaryMode} onChange={(e) => setSummaryMode(e.target.value as SummaryMode)}>
            <option value="short">短总结</option>
            <option value="long">长总结</option>
          </select>
          <button onClick={summarizeThread} disabled={loadingAction !== ""}>
            {loadingAction === "summary" ? "处理中..." : "生成总结"}
          </button>
          {summary ? (
            <div className="result-card">
              <h3>{summaryMode === "short" ? "短总结" : "长总结"}</h3>
              <p>{displayedSummary || "暂无总结"}</p>
              <p className="meta">当前请求模式：{summary.usedMode || summaryMode}</p>
              <ul>
                {(summary.keyPoints || []).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="meta">结果来源：{summary.source || "未知"}</p>
            </div>
          ) : (
            <p className="empty-state">暂无总结结果</p>
          )}
        </section>

        <section className="card reveal delay-2">
          <h2>2. 观点聚类</h2>
          <label htmlFor="cluster-k">聚类目标数：{clusterK}</label>
          <input
            id="cluster-k"
            type="range"
            min={2}
            max={4}
            step={1}
            value={clusterK}
            onChange={(e) => setClusterK(Number(e.target.value))}
          />
          <button className="secondary" onClick={clusterOpinions} disabled={loadingAction !== ""}>
            {loadingAction === "cluster" ? "聚类中..." : "聚类与分歧提炼"}
          </button>
          {cluster?.clusters?.length ? (
            <>
              <label htmlFor="target-cluster">回复目标观点簇</label>
              <select id="target-cluster" value={targetCluster} onChange={(e) => setTargetCluster(e.target.value)}>
                {cluster.clusters.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>

              <ul className="cluster-list">
                {cluster.clusters.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.stance}</p>
                    <p>证据编号：{item.evidenceIds.join(", ") || "无"}</p>
                    <ul>
                      {(item.evidence || []).map((evidence) => (
                        <li key={`${item.label}-${evidence.id}`}>
                          {evidence.id}：{evidence.text}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              {(cluster.disagreements || []).map((item) => (
                <p key={item.topic} className="meta">
                  分歧：{item.topic} | 立场：{item.sides.join(" / ")} | 证据：{item.evidenceIds.join(", ")}
                </p>
              ))}
            </>
          ) : (
            <p className="empty-state">暂无聚类结果</p>
          )}
        </section>

        <section className="card reveal delay-3">
          <h2>3. 评论草稿</h2>
          <label htmlFor="draft-tone">回复语气</label>
          <input id="draft-tone" value={tone} onChange={(e) => setTone(e.target.value)} />
          <textarea
            rows={3}
            value={constraintsText}
            onChange={(e) => setConstraintsText(e.target.value)}
            placeholder="每行一条约束"
          />
          <button onClick={draftReply} disabled={loadingAction !== ""}>
            {loadingAction === "draft" ? "生成中..." : "生成多语气草稿"}
          </button>
          {drafts?.drafts?.length ? (
            <>
              <ul className="draft-list">
                {drafts.drafts.map((item) => (
                  <li key={item.text}>
                    <p className="quote">{item.text}</p>
                    <p className="risk">风险提醒：{item.riskHint}</p>
                  </li>
                ))}
              </ul>
              <p className="meta">已应用约束：{(drafts.constraintsApplied || []).join("、") || "无"}</p>
              <p className="risk">总体风险提示：{drafts.riskHint || drafts.drafts[0]?.riskHint || "无"}</p>
            </>
          ) : (
            <p className="empty-state">暂无草稿结果</p>
          )}
        </section>

        <section className="card reveal delay-4">
          <h2>4. 评估</h2>
          <label htmlFor="run-id">运行标识</label>
          <input id="run-id" value={runId} onChange={(e) => setRunId(e.target.value)} />
          <label htmlFor="reply-confidence">回复信心：{Math.round(replyConfidence * 100)}%</label>
          <input
            id="reply-confidence"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={replyConfidence}
            onChange={(e) => setReplyConfidence(Number(e.target.value))}
          />
          <button className="secondary" onClick={evaluate} disabled={loadingAction !== ""}>
            {loadingAction === "eval" ? "评估中..." : "生成评估"}
          </button>
          <p className="meta">评估存档：{evaluation?.savedRunPath || "未生成"}</p>
          {evaluation ? <pre>{JSON.stringify(evaluation, null, 2)}</pre> : <p className="empty-state">暂无评估结果</p>}
        </section>
      </div>
    </main>
  );
}
