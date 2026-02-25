# 部署指南（GitHub Pages + Vercel）

本仓库采用：

- `apps/portfolio-site` -> GitHub Pages（静态导出）
- `apps/podcast-highlighter` -> Vercel（含 Next.js API routes）
- `apps/community-curator` -> Vercel（含 Next.js API routes）

## 1. GitHub Pages（作品集）

### 1.1 前置设置

1. 仓库切到 `public`
2. Settings -> Pages -> Source 选择 `GitHub Actions`
3. Settings -> Secrets and variables -> Actions -> Variables 新增：
   - `NEXT_PUBLIC_PODCAST_DEMO_URL`：播客演示域名
   - `NEXT_PUBLIC_COMMUNITY_DEMO_URL`：社区演示域名

### 1.2 工作流

- 工作流文件：`.github/workflows/deploy-pages.yml`
- 触发条件：`main` 分支推送且命中 `apps/portfolio-site/**` 或手动触发
- 构建产物：`apps/portfolio-site/out`
- 访问地址：`https://<owner>.github.io/<repo>/`

## 2. Vercel（两个演示）

为 `podcast-highlighter` 与 `community-curator` 各创建一个 Vercel Project。

### 2.1 推荐配置

- Framework Preset: `Next.js`
- Root Directory: 仓库根目录
- Install Command: `pnpm install`
- Build Command:
  - 播客：`pnpm turbo run build --filter=podcast-highlighter`
  - 社区：`pnpm turbo run build --filter=community-curator`

### 2.2 环境变量

两个项目都配置：

- `OPENAI_API_KEY`
- `OPENAI_MODEL_TEXT`（可选）
- `DEMO_API_TOKEN`

## 3. 受控模型调用（已接入）

后端路由行为：

1. 若没有 `OPENAI_API_KEY` -> 强制 fallback
2. 若存在 `DEMO_API_TOKEN`，仅当请求头 `x-demo-token` 匹配时才调用真实模型
3. 其他情况走 fallback

前端页面都提供可选输入 `Demo Token`，用于调用线上受控模型。

## 4. 本地预检命令

```bash
pnpm --filter portfolio-site build
pnpm --filter podcast-highlighter build
pnpm --filter community-curator build
```

## 5. GitHub 账号在 Codex 中的授权

本机安装了 `gh`，但当前未登录。执行以下命令完成授权后，我就可以继续用命令帮你建仓库/推送/检查 Actions：

```bash
gh auth login
gh auth status
```
