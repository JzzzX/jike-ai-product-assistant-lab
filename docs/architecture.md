# 技术架构

## 单仓结构

- `apps/podcast-highlighter`: 播客演示（前端 + API）
- `apps/community-curator`: 社区演示（前端 + API）
- `apps/portfolio-site`: 对外展示站点
- `packages/ai-core`: 模型调用与提示词
- `packages/eval-core`: 评估函数（打分逻辑）

## 运行链路（通用模式）

1. 前端触发步骤接口。
2. 接口在可用时调用模型，否则走 fallback。
3. 输出结构化 JSON 结果。
4. `evaluate` 接口根据本轮真实参数评分。
5. 评分结果写入 `evaluation/runs/*.json` 留档。

## 可靠性策略

- fallback 保证“无模型时可演示”。
- `typecheck + lint + smoke` 作为发布门禁。
- 样本批量评估用于横向对比与回归监控。
