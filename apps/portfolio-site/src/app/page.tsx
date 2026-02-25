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

function scoreLabel(score: number): string {
  if (score >= 90) return "优秀";
  if (score >= 80) return "稳定";
  if (score >= 70) return "可用";
  return "待优化";
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/+$/, "");
const podcastDemoUrl = process.env.NEXT_PUBLIC_PODCAST_DEMO_URL || (basePath ? "#" : "http://localhost:3001");
const communityDemoUrl = process.env.NEXT_PUBLIC_COMMUNITY_DEMO_URL || (basePath ? "#" : "http://localhost:3002");
const docsPath = `${basePath}/docs`;

const hrSteps = [
  "打开任一 Demo，点击“一键跑完整流程”",
  "查看流程输出与评估分数",
  "查看 run 存档与批量评估报告"
] as const;

const coreDocs = [
  { title: "项目概览", path: "docs/overview.md" },
  { title: "技术架构", path: "docs/architecture.md" },
  { title: "评估方法", path: "docs/evaluation.md" },
  { title: "版本发布", path: "docs/releases.md" },
  { title: "一页展示", path: "SHOWCASE.md" }
] as const;

const podcastFiles = [
  "apps/podcast-highlighter/src/app/page.tsx",
  "apps/podcast-highlighter/src/app/api/transcribe/route.ts",
  "apps/podcast-highlighter/src/app/api/highlights/route.ts",
  "apps/podcast-highlighter/src/app/api/evaluate/route.ts"
] as const;

const communityFiles = [
  "apps/community-curator/src/app/page.tsx",
  "apps/community-curator/src/app/api/summarize-thread/route.ts",
  "apps/community-curator/src/app/api/cluster-opinions/route.ts",
  "apps/community-curator/src/app/api/evaluate/route.ts"
] as const;

function FileLink({ filePath }: { filePath: string }) {
  if (!repoUrl) {
    return <span className="file-link">{filePath}</span>;
  }
  return (
    <a className="file-link" href={`${repoUrl}/blob/main/${filePath}`} target="_blank" rel="noreferrer">
      {filePath}
    </a>
  );
}

export default async function Page() {
  const report = await readEvalReport();
  const podcastComposite = report
    ? Math.round((report.podcast.avgQuality + report.podcast.avgSpeed + report.podcast.avgCost + report.podcast.avgStability) / 4)
    : null;
  const communityComposite = report
    ? Math.round(
        (report.community.avgCompression + report.community.avgFaithfulness + report.community.avgSafety + report.community.avgUsability) / 4
      )
    : null;

  return (
    <main className="minimal-shell">
      <header className="top">
        <p>AI Product Prototyping Portfolio</p>
        <nav>
          <a href="#projects">项目</a>
          <a href="#metrics">指标</a>
          <a href="#docs">文档</a>
        </nav>
      </header>

      <section className="hero">
        <h1>AI 产品助理作品集（面向招聘展示）</h1>
        <p className="subtitle">两个可运行、可评估、可回归的 Demo：播客场景与社区场景。</p>

        <div className="actions">
          <a className="btn primary" href={podcastDemoUrl} target="_blank" rel="noreferrer">
            打开播客 Demo
          </a>
          <a className="btn" href={communityDemoUrl} target="_blank" rel="noreferrer">
            打开社区 Demo
          </a>
          <a className="btn" href={docsPath}>
            查看核心文档
          </a>
        </div>

        <div className="meta-line">
          <span>版本：v1.0</span>
          <span>播客综合分：{podcastComposite ?? "--"}</span>
          <span>社区综合分：{communityComposite ?? "--"}</span>
          <span>报告时间：{report?.generatedAt || "未生成"}</span>
        </div>
      </section>

      <section className="block" id="guide">
        <h2>HR 快速查看（3 分钟）</h2>
        <ol className="simple-list">
          {hrSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="block" id="projects">
        <h2>项目矩阵</h2>
        <div className="project-grid">
          <article>
            <h3>播客 AI 高光助手</h3>
            <p>长音频信息提炼：转写 → 高光 → 分享 → 评估</p>
            <ul>
              <li>支持文本与音频输入</li>
              <li>高光时间戳与分段对齐</li>
              <li>评估结果落盘到 `evaluation/runs`</li>
            </ul>
            <div className="file-grid">
              {podcastFiles.map((filePath) => (
                <FileLink key={filePath} filePath={filePath} />
              ))}
            </div>
          </article>

          <article>
            <h3>社区内容 AI 整理员</h3>
            <p>长讨论串提效：总结 → 聚类 → 草稿 → 评估</p>
            <ul>
              <li>支持聚类数和约束可配置</li>
              <li>输出证据映射和风险提示</li>
              <li>评估结果落盘到 `evaluation/runs`</li>
            </ul>
            <div className="file-grid">
              {communityFiles.map((filePath) => (
                <FileLink key={filePath} filePath={filePath} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="block" id="metrics">
        <h2>指标快照</h2>
        {report ? (
          <div className="metric-grid">
            <article>
              <h3>播客项目</h3>
              <p>样本数：{report.podcast.sampleCount}</p>
              <p>质量：{report.podcast.avgQuality}</p>
              <p>速度：{report.podcast.avgSpeed}</p>
              <p>成本：{report.podcast.avgCost}</p>
              <p>稳定性：{report.podcast.avgStability}</p>
              <p>评价：{scoreLabel(podcastComposite || 0)}</p>
            </article>
            <article>
              <h3>社区项目</h3>
              <p>样本数：{report.community.sampleCount}</p>
              <p>压缩：{report.community.avgCompression}</p>
              <p>忠实度：{report.community.avgFaithfulness}</p>
              <p>安全：{report.community.avgSafety}</p>
              <p>可用性：{report.community.avgUsability}</p>
              <p>评价：{scoreLabel(communityComposite || 0)}</p>
            </article>
          </div>
        ) : (
          <p className="hint">未检测到评估报告。请先运行 `pnpm eval:samples`。</p>
        )}
      </section>

      <section className="block" id="docs">
        <h2>核心文档</h2>
        <div className="doc-list">
          {coreDocs.map((item) => (
            <article key={item.path}>
              <h3>{item.title}</h3>
              <code>{item.path}</code>
              {repoUrl ? (
                <a href={`${repoUrl}/blob/main/${item.path}`} target="_blank" rel="noreferrer">
                  在 GitHub 打开
                </a>
              ) : (
                <span className="hint">配置 NEXT_PUBLIC_GITHUB_REPO_URL 后可直达</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
