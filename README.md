# AI 产品助理实验室（招聘展示版）

这是一个可直接展示给 HR / 招聘经理的 AI 产品作品仓库，包含 2 个可运行演示和 1 个总览站点。

## 在线展示结构

- [作品集站点](apps/portfolio-site/README.md)
- [播客 AI 高光助手](apps/podcast-highlighter/README.md)
- [社区内容 AI 整理员](apps/community-curator/README.md)

## HR 快速入口

- 一页展示：[SHOWCASE.md](SHOWCASE.md)
- 项目概览：[docs/overview.md](docs/overview.md)
- 技术架构：[docs/architecture.md](docs/architecture.md)
- 评估结果：[docs/evaluation.md](docs/evaluation.md)
- 版本记录：[docs/releases.md](docs/releases.md)

## 当前版本（v1.0）

- 双演示支持“一键跑完整流程”
- 支持样本批量评估与分数追踪
- 支持 smoke 回归验证
- 每次评估 run 可落盘留档

## 本地运行

```bash
pnpm install
pnpm dev
```

## 质量校验

```bash
pnpm lint
pnpm typecheck
pnpm smoke:v1
pnpm eval:samples
```

说明：执行 `pnpm eval:samples` 前，需要先启动两个演示服务（3001/3002）。

## 仓库结构（展示视角）

- `apps/podcast-highlighter`: 播客场景演示
- `apps/community-curator`: 社区场景演示
- `apps/portfolio-site`: 对外展示站点
- `packages/ai-core`: 模型调用与提示词
- `packages/eval-core`: 评估逻辑与打分函数
- `docs/`: 精简后的对外文档
