# Architecture

## Monorepo Layout

- `apps/podcast-highlighter`: 播客 demo 前后端
- `apps/community-curator`: 社区 demo 前后端
- `apps/portfolio-site`: 对外展示站点
- `packages/ai-core`: 模型调用与提示词
- `packages/eval-core`: 评估函数（打分逻辑）

## Runtime Flow (Common Pattern)

1. 前端触发步骤接口。
2. 接口在可用时调用模型，否则 fallback。
3. 输出结构化 JSON 结果。
4. `evaluate` 接口根据本轮真实参数评分。
5. 评分结果写入 `evaluation/runs/*.json` 作为留档。

## Reliability Strategy

- fallback 保证“无模型时可演示”。
- `typecheck + lint + smoke` 作为发布前门禁。
- 样本批量评估用于横向对比与回归监控。
