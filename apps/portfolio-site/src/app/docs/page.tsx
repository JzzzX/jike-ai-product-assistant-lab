const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const homePath = basePath || "/";

const docs = [
  {
    title: "阶段门禁",
    desc: "定义每个阶段的通过标准，避免范围蔓延导致交付失焦。",
    path: "docs/execution/stage-gates.md"
  },
  {
    title: "风险清单",
    desc: "沉淀模型可用性、内容安全、进度风险与对应缓解措施。",
    path: "docs/execution/risk-register.md"
  },
  {
    title: "面试题库",
    desc: "把项目结果转成可复述、可追问的数据化表达素材。",
    path: "docs/execution/interview-bank.md"
  }
] as const;

export default function DocsPage() {
  return (
    <main className="docs-shell">
      <section className="docs-hero reveal">
        <p className="docs-kicker">Execution Archive</p>
        <h1>项目执行文档中心</h1>
        <p>这组文档用于支撑“需求拆解 → 实验评估 → 决策复盘”的全过程追踪。</p>
        <a className="btn ghost" href={homePath}>
          返回作品集首页
        </a>
      </section>

      <section className="docs-grid reveal delay-1">
        {docs.map((item) => (
          <article className="doc-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <code>{item.path}</code>
            {repoUrl ? (
              <a className="inline-link" href={`${repoUrl}/blob/main/${item.path}`} target="_blank" rel="noreferrer">
                在 GitHub 查看
              </a>
            ) : (
              <span className="inline-muted">配置 NEXT_PUBLIC_GITHUB_REPO_URL 后可直达 GitHub 文件</span>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
