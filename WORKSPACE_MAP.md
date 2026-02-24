# 工作区总览

## 最近更新
- 2026-02-20 18:41:23 +0800：清理无关缓存与构建产物（`.cache`、`.turbo`、`.next`、`*.tsbuildinfo`、`.DS_Store`），并新增 `TOMORROW_DETAILED_PLAN.md`。
- 2026-02-20 18:29:01 +0800：输出明日开工指引（`TOMORROW_START.md`）并刷新阶段映射文档（`PLAN_STAGE_FILE_MAPPING.md`）。
- 2026-02-20 18:21:45 +0800：重构作品集页面视觉与信息结构（价值主张/岗位匹配/项目矩阵/评估证据），并通过 `pnpm typecheck`。
- 2026-02-20 18:15:23 +0800：本轮验证完成后已停止本地开发服务，端口释放完成（可随时 `pnpm dev` 重启）。
- 2026-02-20 18:14:51 +0800：补齐阶段1简历草稿成品（`docs/execution/resume-draft-ai-product-assistant.md`）。
- 2026-02-20 18:13:51 +0800：作品集首页已接入批量评估结果展示（读取 `reports/sample_eval_report.json`），并再次通过 `pnpm typecheck`。
- 2026-02-20 18:13:00 +0800：执行 `pnpm eval:samples` 完成 40 条样本批量评估，生成 `reports/sample_eval_report.md` 与 `reports/sample_eval_report.json`。
- 2026-02-20 18:07:50 +0800：补测剩余 4 个核心接口（share-card/evaluate/reply-draft/evaluate）通过，并回填阶段门禁与实验日志。
- 2026-02-20 17:55:25 +0800：三服务启动成功（3000/3001/3002）并通过核心 API 冒烟测试（transcribe/highlights/summarize/cluster）。
- 2026-02-20 17:49:47 +0800：`pnpm` 已可直接使用（`corepack enable pnpm` 完成），并通过 `pnpm typecheck`。
- 2026-02-20 17:33:30 +0800：执行 `npm view pnpm version` 网络探测，命令超时无返回，registry 可达性仍异常。
- 2026-02-20 17:31:38 +0800：重试激活 `pnpm` 失败，仍无法访问 `registry.npmjs.org`。
- 2026-02-20 17:25:00 +0800（补录）：完成文档中文化（执行文档、应用 README、样本说明、配置说明、投递追踪表）。
- 2026-02-20 17:14:00 +0800（补录）：完成计划阶段与文件映射文档（`PLAN_STAGE_FILE_MAPPING.md`）。
- 2026-02-20 17:10:00 +0800（补录）：补齐阶段 8 投递模板与双项目样本种子数据。

## 根目录文件
- `ai_product_assistant_plan.md`：主计划（8 个阶段）
- `PLAN_STAGE_FILE_MAPPING.md`：计划阶段与文件对应关系
- `TOMORROW_START.md`：明日开工步骤与命令清单
- `TOMORROW_DETAILED_PLAN.md`：明日详细执行计划（分阶段 + 验收标准）
- `README.md`：仓库说明与启动方式
- `.env.example`：运行环境变量模板
- `package.json` / `pnpm-workspace.yaml` / `turbo.json`：monorepo 构建配置
- `tsconfig.base.json`：TypeScript 基础配置
- `prisma/schema.prisma`：实验运行数据模型

## 应用目录
- `apps/podcast-highlighter`：主项目（转写 -> 高光 -> 分享 -> 评估）
- `apps/community-curator`：副项目（总结 -> 聚类 -> 草稿 -> 评估）
- `apps/portfolio-site`：作品集展示页

## 共享包目录
- `packages/ai-core`：模型调用、提示词与类型
- `packages/eval-core`：统一评估逻辑
- `packages/ui`：预留共用 UI 层
- `packages/config`：共享配置说明

## 证据与执行文档
- `docs/execution/positioning-statement.md`：60 秒定位陈述
- `docs/execution/capability-mapping.md`：能力映射
- `docs/execution/resume-rewrite-outline.md`：简历改写骨架
- `docs/execution/stage-gates.md`：阶段门禁
- `docs/execution/risk-register.md`：风险台账
- `docs/execution/interview-bank.md`：面试题库
- `docs/execution/implementation-status.md`：实施状态
- `docs/execution/application-tracker.csv`：投递追踪表
- `docs/execution/feedback-loop.md`：反馈闭环机制

## 数据与临时目录
- `data/podcast-samples`：播客样本（已含种子数据）
- `data/community-samples`：社区样本（已含种子数据）
- `reports/`：批量评估报告输出目录
- `tmp/`：临时文件目录

## 计划进度快照
- 阶段1（岗位对齐与叙事重构）：部分完成
- 阶段2（统一项目规范）：基本完成
- 阶段3（播客项目）：MVP 已完成
- 阶段4（社区项目）：MVP 已完成
- 阶段5（证据层）：已进入实证阶段（40条样本批量评估已完成）
- 阶段6（作品集）：MVP 已完成
- 阶段7（面试系统）：初版完成，待结合真实跑数优化
- 阶段8（投递反馈闭环）：已启动（模板已建）
