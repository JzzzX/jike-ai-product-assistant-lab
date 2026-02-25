# 播客 AI 高光助手

## 问题
长音频内容难以快速定位重点和分享。

## MVP 流程
1. 转写文本/音频输入
2. 提取高光片段
3. 生成分享文案草稿
4. 输出评估结果

## 当前完成度（v0.9）
- 支持文本转写与音频文件上传转写（`multipart/form-data`，`audio/*`，15MB 限制）
- 高光时间戳基于 `segments` 对齐，不再使用固定占位时间
- 分享与评估消费本次运行的真实指标（延迟、错误计数、高光数量）
- 前端提供“一键跑完整流程”操作

## API 列表
- `POST /api/transcribe`
- `POST /api/highlights`
- `POST /api/share-card`
- `POST /api/evaluate`

## 文档
- `docs/prd-lite.md`
- `docs/experiment-log.md`
- `docs/decision-log.md`
- `evaluation/rubric.md`
