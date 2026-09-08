# Deferred Items — Phase 02

## 02-06 执行发现(2026-09-08)

| 项 | 位置 | 说明 | 处置 |
|----|------|------|------|
| py-3 存量(12px) | src/tools/timestamp-converter/timestamp-converter.vue(:24, :119, :124, :138) | 工具操作区 textarea/select 输入控件垂直内边距 12px。不在 Phase 2 D-15 迁移清单(清单:home/not-found/双 layout/ToolCard/JSON 工具),UI-SPEC Spacing Exceptions 亦仅点名双 layout header 与返回键 | 不修(SCOPE BOUNDARY);留待后续阶段批量工具迁移时归一(Phase 5 工具接入面) |
| py-1.5 存量(6px) | src/tools/json-formatter/json-formatter.vue(:22, :35) | 格式化/压缩按钮垂直内边距。属 plan 02-07(JSON 工具迁移)既定迁移面,本计划 files_modified 不含该文件 | 不修(SCOPE BOUNDARY);plan 02-07 执行时随 Button/CopyableText 迁移归一 |
