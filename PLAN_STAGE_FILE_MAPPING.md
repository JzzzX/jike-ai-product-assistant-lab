# Plan 阶段与文件对应表（已更新）

本文件将 `ai_product_assistant_plan.md` 的 8 个阶段，与当前实际落地文件一一对应。

## 阶段 1：岗位对齐与叙事重构
- 目标：定位陈述、能力映射、简历改写。
- 已对应文件：
- `docs/execution/positioning-statement.md`
- `docs/execution/capability-mapping.md`
- `docs/execution/resume-rewrite-outline.md`
- `docs/execution/resume-draft-ai-product-assistant.md`
- 状态：基础完成（可继续按真实项目结果微调简历措辞）。

## 阶段 2：统一项目规范（双项目共用）
- 目标：统一工程结构、评估口径、仓库规范。
- 已对应文件：
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.env.example`
- `packages/ai-core/src/types.ts`
- `packages/eval-core/src/index.ts`
- `prisma/schema.prisma`
- `docs/execution/stage-gates.md`
- 状态：已完成。

## 阶段 3：主项目重实施（播客 AI 高光助手）
- 目标：转写 -> 高光提取 -> 分享草稿 -> 评估。
- 已对应文件：
- `apps/podcast-highlighter/src/app/page.tsx`
- `apps/podcast-highlighter/src/app/api/transcribe/route.ts`
- `apps/podcast-highlighter/src/app/api/highlights/route.ts`
- `apps/podcast-highlighter/src/app/api/share-card/route.ts`
- `apps/podcast-highlighter/src/app/api/evaluate/route.ts`
- `apps/podcast-highlighter/docs/prd-lite.md`
- `apps/podcast-highlighter/docs/experiment-log.md`
- `apps/podcast-highlighter/docs/decision-log.md`
- `apps/podcast-highlighter/evaluation/rubric.md`
- 状态：MVP 完成 + 核心接口冒烟通过。

## 阶段 4：副项目重实施（社区内容 AI 整理员）
- 目标：总结 -> 聚类 -> 草稿 -> 评估。
- 已对应文件：
- `apps/community-curator/src/app/page.tsx`
- `apps/community-curator/src/app/api/summarize-thread/route.ts`
- `apps/community-curator/src/app/api/cluster-opinions/route.ts`
- `apps/community-curator/src/app/api/reply-draft/route.ts`
- `apps/community-curator/src/app/api/evaluate/route.ts`
- `apps/community-curator/docs/prd-lite.md`
- `apps/community-curator/docs/experiment-log.md`
- `apps/community-curator/docs/decision-log.md`
- `apps/community-curator/evaluation/rubric.md`
- 状态：MVP 完成 + 核心接口冒烟通过。

## 阶段 5：产品能力证据层
- 目标：PRD-Lite + 实验日志 + 决策日志 + 风险与门禁。
- 已对应文件：
- `apps/podcast-highlighter/docs/prd-lite.md`
- `apps/podcast-highlighter/docs/experiment-log.md`
- `apps/podcast-highlighter/docs/decision-log.md`
- `apps/community-curator/docs/prd-lite.md`
- `apps/community-curator/docs/experiment-log.md`
- `apps/community-curator/docs/decision-log.md`
- `docs/execution/risk-register.md`
- `docs/execution/stage-gates.md`
- `docs/execution/implementation-status.md`
- `reports/sample_eval_report.md`
- `reports/sample_eval_report.json`
- 状态：已进入实证阶段（40 条样本批量评估完成）。

## 阶段 6：作品集封装（GitHub + 单页站）
- 目标：集中展示项目价值、证据与方法论。
- 已对应文件：
- `apps/portfolio-site/src/app/page.tsx`
- `apps/portfolio-site/src/app/docs/page.tsx`
- `apps/portfolio-site/src/app/layout.tsx`
- `apps/portfolio-site/src/app/globals.css`
- 状态：已完成首版重构（岗位匹配 + 项目矩阵 + 评估证据展示）。

## 阶段 7：面试系统训练（JD 定向）
- 目标：形成问答、案例和稳定叙事。
- 已对应文件：
- `docs/execution/interview-bank.md`
- `docs/execution/positioning-statement.md`
- `docs/execution/capability-mapping.md`
- 状态：初版完成（建议下一步用真实评估数据优化回答）。

## 阶段 8：投递与反馈闭环
- 目标：投递记录、反馈归因、版本迭代。
- 已对应文件：
- `docs/execution/application-tracker.csv`
- `docs/execution/feedback-loop.md`
- 状态：已启动（模板已建，待持续填写真实投递与反馈）。

## 共享能力层（阶段 2/3/4/5 的基础）
- `packages/ai-core/src/openai.ts`：模型调用封装
- `packages/ai-core/src/prompts.ts`：提示词模板
- `packages/eval-core/src/index.ts`：评分逻辑
- `prisma/schema.prisma`：运行记录、评分、错误日志模型

## 明日优先顺序（建议）
1. 先启动服务并截图录屏（作品集 + 两个项目）。
2. 用真实 OpenAI API Key 跑一轮对照评估（model vs fallback）。
3. 把对照结果写进两个 `experiment-log.md` 与面试题库。
4. 更新 `application-tracker.csv`，开始第一轮同类岗位投递。
