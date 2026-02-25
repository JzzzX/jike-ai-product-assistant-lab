# AI Product Prototyping Portfolio

这是一个面向招聘场景的 AI 产品打样作品集：

- [播客 AI 高光助手](apps/podcast-highlighter/README.md)
- [社区内容 AI 整理员](apps/community-curator/README.md)
- [作品集站点](apps/portfolio-site/README.md)

## 给 HR 的快速入口

- 1 页总览: [SHOWCASE.md](SHOWCASE.md)
- 项目概览: [docs/overview.md](docs/overview.md)
- 技术架构: [docs/architecture.md](docs/architecture.md)
- 评估方法与结果: [docs/evaluation.md](docs/evaluation.md)
- 发布记录: [docs/releases.md](docs/releases.md)

## 当前版本

`Demo Release v1.0`

- 双 Demo 支持一键完整流程
- 支持样本批量评估
- 支持自动 smoke 回归
- 评估 run 支持落盘追踪

## 本地运行

```bash
pnpm install
pnpm dev
```

## 质量与验证命令

```bash
pnpm lint
pnpm typecheck
pnpm smoke:v1
pnpm eval:samples
```

说明：`eval:samples` 需要先启动两个 demo 服务（3001/3002）。

## 仓库结构（精简视图）

- `apps/podcast-highlighter`: 音频场景 demo
- `apps/community-curator`: 社区场景 demo
- `apps/portfolio-site`: 对外展示页面
- `packages/ai-core`: 模型调用与提示词
- `packages/eval-core`: 评估函数
- `docs/`: 对外文档
- `docs/internal/`: 内部材料（不作为对外展示）
