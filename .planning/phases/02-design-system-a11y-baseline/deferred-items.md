# Deferred Items — Phase 02

## 02-07 D-23 人工验收跟进(2026-09-08)

| 项 | 位置 | 说明 | 处置 |
|----|------|------|------|
| 站内「减少动态效果」开关(产品决策,Rule 4) | 全站(潜在 UI 新增面) | D-23 验收项 2 用户误以为站内有「减少动态效果」按钮——该项实为 OS 级设置(macOS:系统设置→辅助功能→显示→减弱动态效果;iOS:设置→辅助功能→动态效果)。站点已正确响应 OS 偏好(CDP 仿真 prefers-reduced-motion=reduce 实证 transition-duration=1e-05s,base.css D-22 中和规则生效)。是否额外提供站内可见开关属产品/信息架构决策(新增 UI 面 + 与 OS 设置的关系语义),超出执行器授权(Rule 4) | 不实现;留待产品决策。若决定提供,需与 ThemeToggle 三态语义对齐(存储键 little-utils:v1:* 惯例)并过 UI-SPEC 新增评审 |
| py-3 存量(12px) | src/tools/timestamp-converter/timestamp-converter.vue(:24, :119, :124, :138) | 工具操作区 textarea/select 输入控件垂直内边距 12px。不在 Phase 2 D-15 迁移清单(清单:home/not-found/双 layout/ToolCard/JSON 工具),UI-SPEC Spacing Exceptions 亦仅点名双 layout header 与返回键。02-07 D-23 跟进确认:该页主题切换失效系 useThemeMode 共享机制 bug(已修复,commit 7999e4e),页面样式全为语义变量消费,无 un-migrated 颜色问题 | 不修(SCOPE BOUNDARY);留待后续阶段批量工具迁移时归一(Phase 5 工具接入面) |
| ~~py-1.5 存量(6px)~~ | src/tools/json-formatter/json-formatter.vue(:22, :35) | ~~格式化/压缩按钮垂直内边距~~ | 已于 plan 02-07 随 Button/CopyableText 迁移归一(min-h-11 44px)——本条闭环 |
