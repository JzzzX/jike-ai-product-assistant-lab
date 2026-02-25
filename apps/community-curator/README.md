# 社区内容 AI 整理员

## 问题
随着评论增长，讨论串会变得难以阅读和提炼。

## MVP 流程
1. 总结主帖与评论
2. 聚类观点并提取分歧
3. 生成带语气与风险提示的评论草稿
4. 输出评估结果

## 当前完成度（v1.0）
- 总结支持 `short/long` 模式并回传实际使用模式
- 聚类支持 `clusterK`（2-4）并输出结构化证据与分歧
- 草稿支持从目标观点簇、证据、分歧上下文生成，并返回 `constraintsApplied/riskHint`
- 前端支持自定义约束、多簇选择与“一键跑完整流程”
- 评估结果会持久化到 `evaluation/runs/*.json`

## API 列表
- `POST /api/summarize-thread`
- `POST /api/cluster-opinions`
- `POST /api/reply-draft`
- `POST /api/evaluate`

## 文档
- `docs/prd-lite.md`
- `docs/experiment-log.md`
- `docs/decision-log.md`
- `evaluation/rubric.md`
