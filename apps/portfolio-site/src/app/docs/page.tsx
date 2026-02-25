const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.replace(/\/+$/, "");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const homePath = basePath || "/";

const docs = [
  {
    title: "项目概览",
    desc: "项目定位、场景价值、展示方式。",
    path: "docs/overview.md"
  },
  {
    title: "技术架构",
    desc: "单仓分层、接口流转、评估链路。",
    path: "docs/architecture.md"
  },
  {
    title: "评估方法",
    desc: "指标口径、命令、样本结果与 run 持久化。",
    path: "docs/evaluation.md"
  },
  {
    title: "版本发布",
    desc: "v0.9-v1.0 的迭代记录和门禁。",
    path: "docs/releases.md"
  },
  {
    title: "一页展示",
    desc: "给 HR 的简版介绍。",
    path: "SHOWCASE.md"
  }
] as const;

export default function DocsPage() {
  return (
    <main className="minimal-shell docs-page">
      <header className="top">
        <p>文档中心</p>
        <a href={homePath}>返回首页</a>
      </header>

      <section className="block">
        <h1>项目文档中心（对外版）</h1>
        <p className="subtitle">仅保留招聘评审需要的文档与入口。</p>
        <div className="doc-list">
          {docs.map((item) => (
            <article key={item.path}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
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
