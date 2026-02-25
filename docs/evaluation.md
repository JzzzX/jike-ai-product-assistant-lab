# 评估方法

## 评估原则

- 指标口径统一，不依赖主观描述。
- 每次评估输入可复现。
- 结果可落盘，可追踪版本变化。

## 核心命令

```bash
pnpm typecheck
pnpm lint
pnpm smoke:v1
pnpm eval:samples
```

## 样本评估结果

来源：`reports/sample_eval_report.json`

- 播客场景
  - 样本数：20
  - 平均质量：74.2
  - 平均速度：99.95
  - 平均成本：90.9
  - 平均稳定性：100

- 社区场景
  - 样本数：20
  - 平均压缩：92
  - 平均忠实度：89
  - 平均安全：88
  - 平均可用性：84

## Run 留档

- 播客：`apps/podcast-highlighter/evaluation/runs/*.json`
- 社区：`apps/community-curator/evaluation/runs/*.json`

用于保存每次评估输入和打分结果。
