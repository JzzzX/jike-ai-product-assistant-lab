"use client";

import { useMemo, useState } from "react";

type Segment = { startSec: number; endSec: number; text: string; speaker?: string };
type Highlight = { startSec: number; endSec: number; quote: string; reason: string; score: number };

type TranscriptRes = {
  status: "queued" | "processing" | "done" | "failed";
  transcript?: string;
  segments?: Segment[];
  latencyMs?: number;
  source?: "text" | "audio";
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
  runId?: string;
  savedRunPath?: string;
  metrics?: {
    latencyMs: number;
    errorCount: number;
    hasHighlights: boolean;
    highlightCount: number;
  };
  scores?: Record<string, number>;
  notes?: string[];
};

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export default function Page() {
  const [transcriptInput, setTranscriptInput] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState("一期关于效率与创作状态的播客");
  const [tone, setTone] = useState("理性");
  const [runId, setRunId] = useState("demo-run");
  const [demoToken, setDemoToken] = useState("");
  const [loadingAction, setLoadingAction] = useState<"" | "transcribe" | "highlight" | "share" | "eval">("");
  const [requestError, setRequestError] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [highlightLatencyMs, setHighlightLatencyMs] = useState(0);
  const [shareLatencyMs, setShareLatencyMs] = useState(0);

  const [transcriptRes, setTranscriptRes] = useState<TranscriptRes | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [shareCard, setShareCard] = useState<ShareCardRes | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluateRes | null>(null);
  const [highlightSource, setHighlightSource] = useState<"fallback" | "model" | null>(null);

  const transcriptText = useMemo(
    () => transcriptInput.trim() || transcriptRes?.transcript || "",
    [transcriptInput, transcriptRes]
  );
  const totalLatencyMs = (transcriptRes?.latencyMs || 0) + highlightLatencyMs + shareLatencyMs;

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

  async function postFormData<T>(url: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    if (demoToken.trim()) {
      headers["x-demo-token"] = demoToken.trim();
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData
    });

    const data = (await res.json()) as T;
    if (!res.ok) {
      throw new Error((data as { error?: { message?: string } }).error?.message || `request failed: ${res.status}`);
    }
    return data;
  }

  async function generateFromText() {
    if (!transcriptInput.trim()) {
      setRequestError("请输入转写文本后再生成");
      return;
    }

    setLoadingAction("transcribe");
    setRequestError("");
    try {
      const data = await postJson<TranscriptRes>("/api/transcribe", { transcript: transcriptInput });
      setTranscriptRes(data);
      setHighlights([]);
      setShareCard(null);
      setEvaluation(null);
      setHighlightSource(null);
    } catch (error) {
      setErrorCount((current) => current + 1);
      setRequestError(error instanceof Error ? error.message : "transcribe failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function generateFromAudio() {
    if (!audioFile) {
      setRequestError("请先选择音频文件");
      return;
    }
    if (!audioFile.type.startsWith("audio/")) {
      setRequestError("仅支持 audio/* 格式文件");
      return;
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      setRequestError(`音频不能超过 ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB`);
      return;
    }

    setLoadingAction("transcribe");
    setRequestError("");
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      const data = await postFormData<TranscriptRes>("/api/transcribe", formData);
      setTranscriptRes(data);
      setTranscriptInput("");
      setHighlights([]);
      setShareCard(null);
      setEvaluation(null);
      setHighlightSource(null);
    } catch (error) {
      setErrorCount((current) => current + 1);
      setRequestError(error instanceof Error ? error.message : "audio transcribe failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function runFullFlow() {
    setRequestError("");
    let nextErrorCount = errorCount;

    try {
      setLoadingAction("transcribe");

      let transcribeData: TranscriptRes;
      if (transcriptInput.trim()) {
        transcribeData = await postJson<TranscriptRes>("/api/transcribe", { transcript: transcriptInput });
      } else if (audioFile) {
        if (!audioFile.type.startsWith("audio/")) {
          throw new Error("仅支持 audio/* 格式文件");
        }
        if (audioFile.size > MAX_AUDIO_BYTES) {
          throw new Error(`音频不能超过 ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB`);
        }
        const formData = new FormData();
        formData.append("audio", audioFile);
        transcribeData = await postFormData<TranscriptRes>("/api/transcribe", formData);
      } else {
        throw new Error("请先提供转写文本或上传音频文件");
      }

      setTranscriptRes(transcribeData);
      if (transcribeData.source === "audio") {
        setTranscriptInput("");
      }

      setLoadingAction("highlight");
      const highlightStarted = performance.now();
      const highlightData = await postJson<{ highlights?: Highlight[]; source?: "fallback" | "model" }>("/api/highlights", {
        transcript: transcribeData.transcript || transcriptInput.trim(),
        segments: transcribeData.segments || [],
        maxHighlights: 4,
        strategy: "semantic"
      });
      const nextHighlights = highlightData.highlights || [];
      const nextHighlightLatency = Math.round(performance.now() - highlightStarted);
      setHighlights(nextHighlights);
      setHighlightSource(highlightData.source || null);
      setHighlightLatencyMs(nextHighlightLatency);

      if (!nextHighlights.length) {
        throw new Error("未提取到高光，已终止后续步骤");
      }

      setLoadingAction("share");
      const shareStarted = performance.now();
      const shareData = await postJson<ShareCardRes>("/api/share-card", { episodeTitle: title, highlights: nextHighlights, tone });
      const nextShareLatency = Math.round(performance.now() - shareStarted);
      setShareCard(shareData);
      setShareLatencyMs(nextShareLatency);

      setLoadingAction("eval");
      const evaluationData = await postJson<EvaluateRes>("/api/evaluate", {
        runId,
        latencyMs: (transcribeData.latencyMs || 0) + nextHighlightLatency + nextShareLatency,
        errorCount: nextErrorCount,
        hasHighlights: nextHighlights.length > 0,
        highlightCount: nextHighlights.length
      });
      setEvaluation(evaluationData);
    } catch (error) {
      nextErrorCount += 1;
      setErrorCount(nextErrorCount);
      setRequestError(error instanceof Error ? error.message : "run full flow failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function generateHighlights() {
    if (!transcriptText.trim()) {
      setRequestError("请先完成文本输入或音频转写");
      return;
    }

    setLoadingAction("highlight");
    setRequestError("");
    const started = performance.now();
    try {
      const data = await postJson<{ highlights?: Highlight[]; source?: "fallback" | "model" }>("/api/highlights", {
        transcript: transcriptText,
        segments: transcriptRes?.segments || [],
        maxHighlights: 4,
        strategy: "semantic"
      });
      setHighlights(data.highlights || []);
      setHighlightSource(data.source || null);
      setEvaluation(null);
      setHighlightLatencyMs(Math.round(performance.now() - started));
    } catch (error) {
      setErrorCount((current) => current + 1);
      setRequestError(error instanceof Error ? error.message : "highlight failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function generateShareCard() {
    if (!highlights.length) {
      setRequestError("请先提取高光后再生成分享卡片");
      return;
    }

    setLoadingAction("share");
    setRequestError("");
    const started = performance.now();
    try {
      const data = await postJson<ShareCardRes>("/api/share-card", { episodeTitle: title, highlights, tone });
      setShareCard(data);
      setEvaluation(null);
      setShareLatencyMs(Math.round(performance.now() - started));
    } catch (error) {
      setErrorCount((current) => current + 1);
      setRequestError(error instanceof Error ? error.message : "share card failed");
    } finally {
      setLoadingAction("");
    }
  }

  async function evaluate() {
    setLoadingAction("eval");
    setRequestError("");
    try {
      const data = await postJson<EvaluateRes>("/api/evaluate", {
        runId,
        latencyMs: totalLatencyMs,
        errorCount,
        hasHighlights: highlights.length > 0,
        highlightCount: highlights.length
      });
      setEvaluation(data);
    } catch (error) {
      setErrorCount((current) => current + 1);
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
          <p>累计延迟：{totalLatencyMs} ms</p>
          <p>累计错误：{errorCount}</p>
          <button className="secondary" onClick={runFullFlow} disabled={loadingAction !== ""}>
            {loadingAction ? "执行中..." : "一键跑完整流程"}
          </button>
        </div>
      </section>

      {requestError && <p className="error-banner">{requestError}</p>}

      <div className="grid">
        <section className="card reveal delay-1">
          <h2>1. 转写（文本或音频）</h2>
          <textarea
            rows={10}
            value={transcriptInput}
            onChange={(e) => setTranscriptInput(e.target.value)}
            placeholder="粘贴播客转写文本（可与音频上传二选一）"
          />
          <button onClick={generateFromText} disabled={loadingAction !== ""}>
            {loadingAction === "transcribe" ? "处理中..." : "文本生成分段转写"}
          </button>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
            />
            <button onClick={generateFromAudio} disabled={loadingAction !== "" || !audioFile}>
              {loadingAction === "transcribe" ? "处理中..." : "上传音频并转写"}
            </button>
            <p className="meta" style={{ margin: 0 }}>
              音频文件：{audioFile ? `${audioFile.name} (${Math.round(audioFile.size / 1024)} KB)` : "尚未选择"}
            </p>
            <p className="meta" style={{ margin: 0 }}>
              限制：audio/*，最大 {Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB
            </p>
            <p className="meta" style={{ margin: 0 }}>
              转写来源：{transcriptRes?.source || "未生成"}
            </p>
          </div>
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
          <p className="meta">
            入参指标：latencyMs={totalLatencyMs} / errorCount={errorCount} / hasHighlights=
            {highlights.length > 0 ? "true" : "false"} / highlightCount={highlights.length}
          </p>
          <p className="meta">评估存档：{evaluation?.savedRunPath || "未生成"}</p>
          <pre>{JSON.stringify(evaluation, null, 2)}</pre>
        </section>
      </div>
    </main>
  );
}
