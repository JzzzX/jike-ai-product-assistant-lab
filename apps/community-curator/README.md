# 社区内容 AI 整理员

## 问题
随着评论增长，讨论串会变得难以阅读和提炼。

## MVP 流程
1. 总结主帖与评论
2. 聚类观点并提取分歧
3. 生成带语气与风险提示的评论草稿
4. 输出评估结果

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
