# Experiment Log｜播客 AI 高光助手

| Date | Hypothesis | Variant | Result | Next |
|---|---|---|---|---|
| TBD | 结构化 prompt 能提高高光稳定性 | v1 vs v2 | TBD | TBD |
| 2026-02-20 17:55:25 +0800 | 核心接口可在无 API Key 场景稳定返回结构化结果 | fallback 流程 | `/api/transcribe`、`/api/highlights` 冒烟通过，返回结构完整 | 增加 share-card/evaluate 验证并记录评分 |
| 2026-02-20 18:07:50 +0800 | 分享与评估接口可形成完整闭环 | fallback + 启发式评分 | `/api/share-card`、`/api/evaluate` 冒烟通过，评分返回 quality/speed/cost/stability | 接入真实样本批量跑分并生成图表 |
