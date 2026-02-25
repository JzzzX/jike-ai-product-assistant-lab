# Evaluation

## Principles

- 使用统一口径指标，不靠主观描述。
- 每次评估输入必须可复现。
- 结果可落盘，可追踪版本变化。

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm smoke:v1
pnpm eval:samples
```

## Sample Evaluation Output

来源：`reports/sample_eval_report.json`

- Podcast
  - 样本数: 20
  - 平均质量: 74.2
  - 平均速度: 99.95
  - 平均成本: 90.9
  - 平均稳定性: 100

- Community
  - 样本数: 20
  - 平均压缩: 92
  - 平均忠实度: 89
  - 平均安全: 88
  - 平均可用性: 84

## Run Persistence

- Podcast: `apps/podcast-highlighter/evaluation/runs/*.json`
- Community: `apps/community-curator/evaluation/runs/*.json`

用于留档每次评估输入和打分结果。
