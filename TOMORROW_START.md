# 明日开工指引

## 0. 启动前确认
1. 在项目根目录执行：
```bash
cd /Users/jguinsoo/Desktop/即刻TPM
pnpm -v
```
2. 若版本显示 `9.12.3`（或可用版本）即可继续。

## 1. 启动服务
```bash
pnpm dev
```
访问：
- 作品集：`http://localhost:3000`
- 播客项目：`http://localhost:3001`
- 社区项目：`http://localhost:3002`

## 2. 明日必做（按优先级）
1. 录屏与截图
- 作品集首页 1 段
- 播客项目完整流程 1 段
- 社区项目完整流程 1 段

2. 跑真实模型对照实验
- 配置 `OPENAI_API_KEY`
- 分别跑 fallback 和 model 两组
- 对比指标（质量/速度/成本/稳定性）

3. 回填证据文档
- `apps/podcast-highlighter/docs/experiment-log.md`
- `apps/community-curator/docs/experiment-log.md`
- `docs/execution/interview-bank.md`（加入数据化回答）

4. 开始投递闭环
- 更新：`docs/execution/application-tracker.csv`
- 记录每次投递版本与反馈摘要

## 3. 快速验证命令
```bash
pnpm typecheck
pnpm eval:samples
```

## 4. 今日已完成（便于接续）
- 依赖安装、类型检查、三服务启动验证均已通过。
- 两个项目 8 个核心接口已冒烟通过。
- 40 条样本评估报告已生成：
  - `reports/sample_eval_report.md`
  - `reports/sample_eval_report.json`
- 作品集已接入评估报告展示。

## 5. 结束时记得
- 停止服务：在 `pnpm dev` 终端按 `Ctrl+C`
- 更新：`WORKSPACE_MAP.md` 最近更新（带时间戳）
