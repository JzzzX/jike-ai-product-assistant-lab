# 明日详细执行计划（可直接照做）

## 今日收口状态（明日基线）
- 工程可运行：`pnpm install`、`pnpm typecheck` 已通过。
- 三站点可启动：`3000/3001/3002`。
- 8 个核心接口已冒烟通过。
- 已有 40 条样本评估报告。
- 目录已清理（缓存与构建产物已删除）。

---

## 明日总目标（必须达成）
1. 用真实模型跑一轮对照实验（fallback vs model）。
2. 把结果写进实验日志和面试题库（形成“可讲证据”）。
3. 完成第一轮可投递版本（简历+作品集+追踪表更新）。

---

## 阶段 A：开工准备（15-20 分钟）
### 操作
1. 启动环境
```bash
cd /Users/jguinsoo/Desktop/即刻TPM
pnpm dev
```
2. 打开页面确认
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`

3. 新开终端做检查
```bash
cd /Users/jguinsoo/Desktop/即刻TPM
pnpm typecheck
pnpm eval:samples
```

### 验收标准
- 三个页面都能打开。
- 命令全部成功返回。

---

## 阶段 B：接入真实模型并跑对照（60-90 分钟）
### 操作
1. 设置环境变量（本地终端）
```bash
export OPENAI_API_KEY='你的key'
export OPENAI_MODEL_TEXT='gpt-4.1-mini'
export OPENAI_MODEL_TRANSCRIBE='gpt-4o-mini-transcribe'
```

2. 先做小样本验证（每项目 3 条）
- 播客：调用 `/api/highlights`、`/api/share-card`
- 社区：调用 `/api/summarize-thread`、`/api/reply-draft`

3. 跑批量报告（带 key）
```bash
pnpm eval:samples
```

4. 记录两组结果
- 组1：不设 key（fallback）
- 组2：设 key（model）

### 必填记录文件
- `apps/podcast-highlighter/docs/experiment-log.md`
- `apps/community-curator/docs/experiment-log.md`
- `reports/sample_eval_report.md`（保留最新一版）

### 验收标准
- 至少有 1 组“fallback vs model”可比数据。
- 每个项目各有 2 条明确结论（提升点/问题点）。

---

## 阶段 C：把数据变成面试话术（40-60 分钟）
### 操作
1. 更新面试题库
- 文件：`docs/execution/interview-bank.md`
- 至少补 5 个“数据化回答”。

2. 更新简历草稿中的项目结果
- 文件：`docs/execution/resume-draft-ai-product-assistant.md`
- 加入真实对照结论（不是只写“做了什么”）。

3. 更新作品集文案（可选）
- 文件：`apps/portfolio-site/src/app/page.tsx`
- 把“当前评分来自启发式”改成“已完成第一轮真实对照”。

### 验收标准
- 你能用 90 秒讲完每个项目：场景 -> 方案 -> 指标 -> 结论。

---

## 阶段 D：投递闭环启动（20-30 分钟）
### 操作
1. 更新投递追踪表
- 文件：`docs/execution/application-tracker.csv`
- 新增目标公司/岗位/版本号。

2. 记录下一步动作
- 文件：`docs/execution/feedback-loop.md`
- 写下本轮要观察的反馈项（例如“项目深度是否被追问”）。

### 验收标准
- 至少 1 条新投递记录，且有明确 next_action。

---

## 明日结束前必须更新
1. `WORKSPACE_MAP.md`
- 在“最近更新”加时间戳（到秒）和当日成果。

2. `docs/execution/implementation-status.md`
- 更新“已完成/待完成/阻塞”。

3. 服务收尾
- `pnpm dev` 终端 `Ctrl+C` 停止。

---

## 常见卡点与应对
1. API key 不生效
- 检查是否在同一个终端 `export`。
- 重启 `pnpm dev`。

2. 报告数据无变化
- 确认 model 路径被触发（检查返回字段是否仍是 fallback）。

3. 时间不够
- 优先顺序：
1) 对照实验
2) 面试题库回填
3) 投递追踪
