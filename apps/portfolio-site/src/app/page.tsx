import { readFile } from "node:fs/promises";
import path from "node:path";

type EvalReport = {
  generatedAt: string;
  podcast: {
    sampleCount: number;
    avgHighlightScore: number;
    avgQuality: number;
    avgSpeed: number;
    avgCost: number;
    avgStability: number;
  };
  community: {
    sampleCount: number;
    avgCompression: number;
    avgFaithfulness: number;
    avgSafety: number;
    avgUsability: number;
  };
};

async function readEvalReport(): Promise<EvalReport | null> {
  try {
    const reportPath = path.resolve(process.cwd(), "../../reports/sample_eval_report.json");
    const content = await readFile(reportPath, "utf8");
    return JSON.parse(content) as EvalReport;
  } catch {
    return null;
  }
}

function scoreTag(score: number): string {
  if (score >= 90) return "优秀";
  if (score >= 80) return "稳定";
  if (score >= 70) return "可用";
  return "待优化";
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const podcastDemoUrl = process.env.NEXT_PUBLIC_PODCAST_DEMO_URL || (basePath ? "#" : "http://localhost:3001");
const communityDemoUrl = process.env.NEXT_PUBLIC_COMMUNITY_DEMO_URL || (basePath ? "#" : "http://localhost:3002");
const docsPath = `${basePath}/docs`;

const capabilityCards = [
  {
    title: "需求拆解",
    text: "把模糊目标拆成一周内可验证闭环，优先解决高频痛点。"
  },
  {
    title: "快速打样",
    text: "统一接口与提示词模板，保持多场景并行迭代的开发效率。"
  },
  {
    title: "实证复盘",
    text: "每轮保留样本、指标、失败记录与决策依据，确保结论可追溯。"
  }
] as const;

export default async function Page() {
  const report = await readEvalReport();

  const podcastComposite = report
    ? Math.round((report.podcast.avgQuality + report.podcast.avgSpeed + report.podcast.avgCost + report.podcast.avgStability) / 4)
    : null;

  const communityComposite = report
    ? Math.round(
        (report.community.avgCompression + report.community.avgFaithfulness + report.community.avgSafety + report.community.avgUsability) /
          4
      )
    : null;

  return (
    <main className="portfolio-shell">
      <div className="noise-layer" />

      <section className="topbar reveal">
        <p className="brand">AI Product Assistant Lab</p>
        <div className="topbar-links">
          <a href="#projects">项目矩阵</a>
          <a href="#evidence">评估证据</a>
          <a href={docsPath}>执行文档</a>
        </div>
      </section>

      <section className="hero-panel reveal delay-1">
        <div className="hero-copy">
          <p className="hero-eyebrow">技术型 AI 产品助理候选人</p>
          <h1>让每个产品想法都能落成可验证的证据</h1>
          <p className="hero-sub">
            我用同一套方法同时推进音视频与社区场景: 需求拆解、快速打样、批量评估、决策复盘。目标不是堆功能，而是让每轮迭代都有可解释的结果。
          </p>

          <div className="hero-pills">
            <span>40 条样本评估</span>
            <span>8 个核心接口</span>
            <span>双项目并行验证</span>
            <span>可演示可追溯</span>
          </div>

          <div className="hero-actions">
            <a className="btn primary" href={podcastDemoUrl} target="_blank" rel="noreferrer">
              体验播客 Demo
            </a>
            <a className="btn ghost" href={communityDemoUrl} target="_blank" rel="noreferrer">
              体验社区 Demo
            </a>
          </div>
        </div>

        <aside className="hero-side">
          <article className="score-card">
            <p>播客项目综合分</p>
            <h2>{podcastComposite ?? "--"}</h2>
            <span>{podcastComposite ? scoreTag(podcastComposite) : "等待评估"}</span>
          </article>
          <article className="score-card">
            <p>社区项目综合分</p>
            <h2>{communityComposite ?? "--"}</h2>
            <span>{communityComposite ? scoreTag(communityComposite) : "等待评估"}</span>
          </article>
          <article className="status-card">
            <p>最新报告</p>
            <strong>{report?.generatedAt ?? "尚未生成"}</strong>
            <small>数据源: reports/sample_eval_report.json</small>
          </article>
        </aside>
      </section>

      <section className="section reveal delay-2">
        <div className="section-head">
          <h2>能力画布</h2>
          <p>围绕“可验证”构建统一工作流，而不是零散功能堆叠。</p>
        </div>
        <div className="capability-grid">
          {capabilityCards.map((item) => (
            <article key={item.title} className="capability-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
          <article className="capability-card flow-card">
            <h3>方法论闭环</h3>
            <p>需求定义 → 假设设计 → MVP 打样 → 样本评估 → 决策日志。</p>
            <div className="flow-track">
              <span>需求</span>
              <span>打样</span>
              <span>评估</span>
              <span>迭代</span>
            </div>
          </article>
        </div>
      </section>

      <section id="projects" className="section reveal delay-3">
        <div className="section-head">
          <h2>双项目矩阵</h2>
          <p>主项目聚焦音视频信息提炼，副项目聚焦社区讨论提效。</p>
        </div>
        <div className="project-grid">
          <article className="project-card podcast">
            <div className="project-head">
              <h3>播客 AI 高光助手</h3>
              <span className="badge">Audio</span>
            </div>
            <p className="project-desc">把长音频转成可分享片段，支撑内容发现与传播。</p>
            <ul>
              <li>流程: 转写 → 高光提取 → 分享草稿 → 评估</li>
              <li>接口: /api/transcribe /highlights /share-card /evaluate</li>
              <li>目标: 提升高光可解释性与分享可用性</li>
            </ul>
            <div className="project-metric">
              <strong>综合分 {podcastComposite ?? "--"}</strong>
              <span>{podcastComposite ? scoreTag(podcastComposite) : "待评估"}</span>
            </div>
            <a className="inline-link" href={podcastDemoUrl} target="_blank" rel="noreferrer">
              打开在线 Demo
            </a>
          </article>

          <article className="project-card community">
            <div className="project-head">
              <h3>社区内容 AI 整理员</h3>
              <span className="badge">Community</span>
            </div>
            <p className="project-desc">把长讨论串聚焦为结构化观点和安全回复草稿。</p>
            <ul>
              <li>流程: 总结 → 聚类分歧 → 回复草稿 → 评估</li>
              <li>接口: /api/summarize-thread /cluster-opinions /reply-draft /evaluate</li>
              <li>目标: 降低信息负担并提升互动效率</li>
            </ul>
            <div className="project-metric">
              <strong>综合分 {communityComposite ?? "--"}</strong>
              <span>{communityComposite ? scoreTag(communityComposite) : "待评估"}</span>
            </div>
            <a className="inline-link" href={communityDemoUrl} target="_blank" rel="noreferrer">
              打开在线 Demo
            </a>
          </article>
        </div>
      </section>

      <section id="evidence" className="section reveal delay-4">
        <div className="section-head">
          <h2>评估证据</h2>
          <p>用同口径指标追踪两条产品线，确保迭代方向可度量。</p>
        </div>
        {report ? (
          <div className="evidence-grid">
            <article className="evidence-card">
              <h3>播客项目</h3>
              <dl>
                <div>
                  <dt>样本数</dt>
                  <dd>{report.podcast.sampleCount}</dd>
                </div>
                <div>
                  <dt>质量</dt>
                  <dd>{report.podcast.avgQuality}</dd>
                </div>
                <div>
                  <dt>速度</dt>
                  <dd>{report.podcast.avgSpeed}</dd>
                </div>
                <div>
                  <dt>成本</dt>
                  <dd>{report.podcast.avgCost}</dd>
                </div>
                <div>
                  <dt>稳定性</dt>
                  <dd>{report.podcast.avgStability}</dd>
                </div>
              </dl>
            </article>
            <article className="evidence-card">
              <h3>社区项目</h3>
              <dl>
                <div>
                  <dt>样本数</dt>
                  <dd>{report.community.sampleCount}</dd>
                </div>
                <div>
                  <dt>压缩</dt>
                  <dd>{report.community.avgCompression}</dd>
                </div>
                <div>
                  <dt>忠实度</dt>
                  <dd>{report.community.avgFaithfulness}</dd>
                </div>
                <div>
                  <dt>安全</dt>
                  <dd>{report.community.avgSafety}</dd>
                </div>
                <div>
                  <dt>可用性</dt>
                  <dd>{report.community.avgUsability}</dd>
                </div>
              </dl>
            </article>
          </div>
        ) : (
          <p className="empty-hint">未发现评估数据，请先执行 `pnpm eval:samples`。</p>
        )}
      </section>

      <section className="section reveal delay-5">
        <div className="section-head">
          <h2>文档与复盘</h2>
          <p>阶段门禁、风险台账和面试题库统一沉淀在执行文档里。</p>
        </div>
        <div className="doc-links">
          <a href={docsPath}>打开执行文档中心</a>
          <a href={podcastDemoUrl} target="_blank" rel="noreferrer">
            播客演示入口
          </a>
          <a href={communityDemoUrl} target="_blank" rel="noreferrer">
            社区演示入口
          </a>
        </div>
      </section>
    </main>
  );
}
