"use client";

import { useMemo, useState } from "react";

type Segment = { startSec: number; endSec: number; text: string; speaker?: string };
type Highlight = { startSec: number; endSec: number; quote: string; reason: string; score: number };

type TranscriptRes = {
  status: "queued" | "processing" | "done" | "failed";
  transcript?: string;
  segments?: Segment[];
  latencyMs?: number;
  error?: { code: string; message: string };
};

type ShareCardRes = {
  headline?: string;
  summary?: string;
  commentDrafts?: string[];
  tags?: string[];
  source?: "fallback" | "model";
};

type EvaluateRes = {
  scores?: Record<string, number>;
  notes?: string[];
};

export default function Page() {
  const [transcriptInput, setTranscriptInput] = useState("");
  const [title, setTitle] = useState("一期关于效率与创作状态的播客");
  const [tone, setTone] = useState("理性");
  const [runId, setRunId] = useState("demo-run");
  const [demoToken, setDemoToken] = useState("");
  const [loadingAction, setLoadingAction] = useState<"" | "transcribe" | "highlight" | "share" | "eval">("");
  const [requestError, setRequestError] = useState("");

  const [transcriptRes, setTranscriptRes] = useState<TranscriptRes | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [shareCard, setShareCard] = useState<ShareCardRes | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluateRes | null>(null);
  const [highlightSource, setHighlightSource] = useState<"fallback" | "model" | null>(null);

  const transcriptText = useMemo(() => transcriptRes?.transcript || transcriptInput, [transcriptInput, transcriptRes]);

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

  async function generateFromText() {
    setLoadingAction("transcribe");
    setRequestError("");
    try {
      const data = await postJson<TranscriptRes>("/api/transcribe", { transcript: transcriptInput });
      setTranscriptRes(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "transcribe failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function generateHighlights() {
    setLoadingAction("highlight");
    setRequestError("");
    try {
      const data = await postJson<{ highlights?: Highlight[]; source?: "fallback" | "model" }>("/api/highlights", {
        transcript: transcriptText,
        maxHighlights: 4,
        strategy: "semantic"
      });
      setHighlights(data.highlights || []);
      setHighlightSource(data.source || null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "highlight failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function generateShareCard() {
    setLoadingAction("share");
    setRequestError("");
    try {
      const data = await postJson<ShareCardRes>("/api/share-card", { episodeTitle: title, highlights, tone });
      setShareCard(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "share card failed");
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
          <p className="eyebrow">Podcast Demo</p>
          <h1>播客 AI 高光助手</h1>
          <p className="hero-sub">验证闭环：转写 → 高光提取 → 分享草稿 → 评估。可选带 token 调真实模型。</p>
          <div className="hero-tags">
            <span>结构化高光</span>
            <span>可解释理由</span>
            <span>source 标记</span>
            <span>可控调用</span>
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
          <p>当前高光来源：{highlightSource || "尚未请求"}</p>
        </div>
      </section>

      {requestError && <p className="error-banner">{requestError}</p>}

      <div className="grid">
        <section className="card reveal delay-1">
          <h2>1. 输入转写文本</h2>
          <textarea
            rows={10}
            value={transcriptInput}
            onChange={(e) => setTranscriptInput(e.target.value)}
            placeholder="粘贴播客转写文本，后续可替换为音频上传流程"
          />
          <button onClick={generateFromText} disabled={loadingAction !== ""}>
            {loadingAction === "transcribe" ? "处理中..." : "生成分段转写"}
          </button>
          {transcriptRes?.segments?.length ? (
            <ul className="segments">
              {transcriptRes.segments.slice(0, 6).map((segment, idx) => (
                <li key={`${segment.startSec}-${idx}`}>
                  <strong>
                    {segment.startSec}s - {segment.endSec}s
                  </strong>
                  <span>{segment.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(transcriptRes, null, 2)}</pre>
          )}
        </section>

        <section className="card reveal delay-2">
          <h2>2. 高光提取</h2>
          <button className="secondary" onClick={generateHighlights} disabled={loadingAction !== ""}>
            {loadingAction === "highlight" ? "提取中..." : "提取高光"}
          </button>
          {highlights.length > 0 ? (
            <ul className="highlight-list">
              {highlights.map((item, idx) => (
                <li key={`${item.startSec}-${idx}`}>
                  <p className="quote">“{item.quote}”</p>
                  <p className="meta">
                    {item.startSec}s-{item.endSec}s · 分数 {item.score}
                  </p>
                  <p className="reason">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(highlights, null, 2)}</pre>
          )}
        </section>

        <section className="card reveal delay-3">
          <h2>3. 分享卡片</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <input value={tone} onChange={(e) => setTone(e.target.value)} style={{ marginTop: 8 }} />
          <button onClick={generateShareCard} disabled={loadingAction !== ""}>
            {loadingAction === "share" ? "生成中..." : "生成分享文案"}
          </button>
          {shareCard?.headline ? (
            <div className="result-card">
              <h3>{shareCard.headline}</h3>
              <p>{shareCard.summary}</p>
              <ul>
                {(shareCard.commentDrafts || []).map((draft) => (
                  <li key={draft}>{draft}</li>
                ))}
              </ul>
              <p className="meta">source: {shareCard.source || "unknown"}</p>
            </div>
          ) : (
            <pre>{JSON.stringify(shareCard, null, 2)}</pre>
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
