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
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Usable";
  return "Needs Iteration";
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/+$/, "");
const podcastDemoUrl = process.env.NEXT_PUBLIC_PODCAST_DEMO_URL || (basePath ? "#" : "http://localhost:3001");
const communityDemoUrl = process.env.NEXT_PUBLIC_COMMUNITY_DEMO_URL || (basePath ? "#" : "http://localhost:3002");
const docsPath = `${basePath}/docs`;

const quickSteps = [
  {
    title: "Open a Demo",
    desc: "Choose Podcast or Community demo based on the workflow you want to verify."
  },
  {
    title: "Run Full Flow",
    desc: "Click one button to execute the full pipeline and inspect structured output."
  },
  {
    title: "Check Evidence",
    desc: "Review scores, smoke checks, and persisted run files for traceability."
  }
] as const;

const docLinks = [
  { title: "Project Overview", path: "docs/overview.md" },
  { title: "Architecture", path: "docs/architecture.md" },
  { title: "Evaluation", path: "docs/evaluation.md" },
  { title: "Releases", path: "docs/releases.md" },
  { title: "Showcase One-Pager", path: "SHOWCASE.md" }
] as const;

const podcastKeyFiles = [
  "apps/podcast-highlighter/src/app/page.tsx",
  "apps/podcast-highlighter/src/app/api/transcribe/route.ts",
  "apps/podcast-highlighter/src/app/api/highlights/route.ts",
  "apps/podcast-highlighter/src/app/api/evaluate/route.ts"
] as const;

const communityKeyFiles = [
  "apps/community-curator/src/app/page.tsx",
  "apps/community-curator/src/app/api/summarize-thread/route.ts",
  "apps/community-curator/src/app/api/cluster-opinions/route.ts",
  "apps/community-curator/src/app/api/evaluate/route.ts"
] as const;

function RepoLink({ filePath }: { filePath: string }) {
  if (!repoUrl) {
    return <span className="file-item">{filePath}</span>;
  }

  return (
    <a className="file-item" href={`${repoUrl}/blob/main/${filePath}`} target="_blank" rel="noreferrer">
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
    <main className="showcase-shell">
      <header className="site-nav reveal">
        <p className="site-name">AI Product Prototyping Portfolio</p>
        <nav>
          <a href="#projects">Projects</a>
          <a href="#metrics">Metrics</a>
          <a href="#docs">Docs</a>
        </nav>
      </header>

      <section className="hero reveal delay-1">
        <div className="hero-main">
          <p className="hero-kicker">Built for hiring review</p>
          <h1>Two AI product demos, one verifiable delivery standard.</h1>
          <p>
            This repository focuses on practical product execution: problem framing, fast prototyping, measurable evaluation, and
            release discipline.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href={podcastDemoUrl} target="_blank" rel="noreferrer">
              Open Podcast Demo
            </a>
            <a className="btn secondary" href={communityDemoUrl} target="_blank" rel="noreferrer">
              Open Community Demo
            </a>
            <a className="btn plain" href={docsPath}>
              Read Core Docs
            </a>
          </div>
        </div>

        <aside className="hero-meta">
          <article>
            <p>Current release</p>
            <strong>v1.0</strong>
          </article>
          <article>
            <p>Podcast score</p>
            <strong>{podcastComposite ?? "--"}</strong>
            <span>{podcastComposite ? scoreLabel(podcastComposite) : "No report yet"}</span>
          </article>
          <article>
            <p>Community score</p>
            <strong>{communityComposite ?? "--"}</strong>
            <span>{communityComposite ? scoreLabel(communityComposite) : "No report yet"}</span>
          </article>
          <article>
            <p>Last report</p>
            <strong>{report?.generatedAt || "Not generated"}</strong>
          </article>
        </aside>
      </section>

      <section className="quickstart reveal delay-2">
        <h2>How to use this portfolio in 3 minutes</h2>
        <div className="step-grid">
          {quickSteps.map((item, index) => (
            <article key={item.title} className="step-card">
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="projects" className="projects reveal delay-3">
        <div className="section-head">
          <h2>Project Matrix</h2>
          <p>Each demo has an end-to-end user flow, explicit API boundaries, and evaluation output.</p>
        </div>

        <div className="project-grid">
          <article className="project-card podcast">
            <header>
              <h3>Podcast Highlighter</h3>
              <span>Audio</span>
            </header>
            <p>Convert long-form audio content into shareable highlights with timestamps and rationale.</p>
            <ul>
              <li>Flow: Transcribe → Highlight → Share Card → Evaluate</li>
              <li>Supports text input and audio upload</li>
              <li>Includes run persistence in `evaluation/runs`</li>
            </ul>
            <div className="project-actions">
              <a href={podcastDemoUrl} target="_blank" rel="noreferrer">
                Try Demo
              </a>
              <a href={docsPath}>See Metrics</a>
            </div>
            <div className="file-list">
              {podcastKeyFiles.map((filePath) => (
                <RepoLink key={filePath} filePath={filePath} />
              ))}
            </div>
          </article>

          <article className="project-card community">
            <header>
              <h3>Community Curator</h3>
              <span>Discussion</span>
            </header>
            <p>Turn noisy threads into structured summaries, opinion clusters, and safe response drafts.</p>
            <ul>
              <li>Flow: Summarize → Cluster → Draft Reply → Evaluate</li>
              <li>Supports cluster count control and evidence mapping</li>
              <li>Includes run persistence in `evaluation/runs`</li>
            </ul>
            <div className="project-actions">
              <a href={communityDemoUrl} target="_blank" rel="noreferrer">
                Try Demo
              </a>
              <a href={docsPath}>See Metrics</a>
            </div>
            <div className="file-list">
              {communityKeyFiles.map((filePath) => (
                <RepoLink key={filePath} filePath={filePath} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="metrics" className="metrics reveal delay-4">
        <div className="section-head">
          <h2>Evidence Snapshot</h2>
          <p>Numbers come from `reports/sample_eval_report.json` and can be regenerated by command.</p>
        </div>

        {report ? (
          <div className="metric-grid">
            <article className="metric-card">
              <h3>Podcast</h3>
              <dl>
                <div>
                  <dt>Sample Count</dt>
                  <dd>{report.podcast.sampleCount}</dd>
                </div>
                <div>
                  <dt>Quality</dt>
                  <dd>{report.podcast.avgQuality}</dd>
                </div>
                <div>
                  <dt>Speed</dt>
                  <dd>{report.podcast.avgSpeed}</dd>
                </div>
                <div>
                  <dt>Cost</dt>
                  <dd>{report.podcast.avgCost}</dd>
                </div>
                <div>
                  <dt>Stability</dt>
                  <dd>{report.podcast.avgStability}</dd>
                </div>
              </dl>
            </article>

            <article className="metric-card">
              <h3>Community</h3>
              <dl>
                <div>
                  <dt>Sample Count</dt>
                  <dd>{report.community.sampleCount}</dd>
                </div>
                <div>
                  <dt>Compression</dt>
                  <dd>{report.community.avgCompression}</dd>
                </div>
                <div>
                  <dt>Faithfulness</dt>
                  <dd>{report.community.avgFaithfulness}</dd>
                </div>
                <div>
                  <dt>Safety</dt>
                  <dd>{report.community.avgSafety}</dd>
                </div>
                <div>
                  <dt>Usability</dt>
                  <dd>{report.community.avgUsability}</dd>
                </div>
              </dl>
            </article>
          </div>
        ) : (
          <p className="empty-tip">Run `pnpm eval:samples` after starting demo servers to generate the report.</p>
        )}
      </section>

      <section id="docs" className="docs reveal delay-5">
        <div className="section-head">
          <h2>Core Documents</h2>
          <p>Only the documents needed for external review are listed here.</p>
        </div>
        <div className="doc-grid">
          {docLinks.map((item) => (
            <article key={item.path} className="doc-card">
              <h3>{item.title}</h3>
              <code>{item.path}</code>
              {repoUrl ? (
                <a href={`${repoUrl}/blob/main/${item.path}`} target="_blank" rel="noreferrer">
                  Open in GitHub
                </a>
              ) : (
                <span className="muted">Set NEXT_PUBLIC_GITHUB_REPO_URL to enable GitHub links</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
