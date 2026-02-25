const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const homePath = basePath || "/";

const docs = [
  {
    title: "Overview",
    desc: "项目定位、两条产品线目标和对招聘场景的展示方式。",
    path: "docs/overview.md"
  },
  {
    title: "Architecture",
    desc: "Monorepo 结构、接口流转、fallback 与评估链路。",
    path: "docs/architecture.md"
  },
  {
    title: "Evaluation",
    desc: "指标口径、验证命令、样本结果与 run 落盘策略。",
    path: "docs/evaluation.md"
  },
  {
    title: "Releases",
    desc: "v0.9 到 v1.0 的发布增量与质量门禁。",
    path: "docs/releases.md"
  },
  {
    title: "Showcase",
    desc: "给 HR 的一页式项目介绍。",
    path: "SHOWCASE.md"
  }
] as const;

export default function DocsPage() {
  return (
    <main className="docs-shell">
      <header className="docs-header reveal">
        <p>Core Docs</p>
        <h1>External Review Document Center</h1>
        <a className="back-link" href={homePath}>
          Back to Portfolio
        </a>
      </header>

      <section className="docs-grid reveal delay-1">
        {docs.map((item) => (
          <article key={item.path} className="doc-panel">
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <code>{item.path}</code>
            {repoUrl ? (
              <a href={`${repoUrl}/blob/main/${item.path}`} target="_blank" rel="noreferrer">
                Open in GitHub
              </a>
            ) : (
              <span className="muted">Set NEXT_PUBLIC_GITHUB_REPO_URL to enable link</span>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
