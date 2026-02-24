# Experiment Log｜社区内容 AI 整理员

| Date | Hypothesis | Variant | Result | Next |
|---|---|---|---|---|
| TBD | 引入证据映射能提高可解释性 | with evidence vs without | TBD | TBD |
| 2026-02-20 17:55:25 +0800 | 总结与聚类接口可稳定返回结构化结果 | fallback 流程 | `/api/summarize-thread`、`/api/cluster-opinions` 冒烟通过，含 evidenceMap 字段 | 补测 reply-draft/evaluate 并增加安全样本 |
| 2026-02-20 18:07:50 +0800 | 回复草稿与评估接口可形成闭环 | fallback + 启发式评分 | `/api/reply-draft`、`/api/evaluate` 冒烟通过，返回 safety/usability 等评分 | 引入高冲突样本并对比风险提示质量 |
