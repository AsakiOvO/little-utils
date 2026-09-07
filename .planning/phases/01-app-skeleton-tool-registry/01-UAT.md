---
status: testing
phase: 01-应用骨架与工具注册表契约
source: [01-VERIFICATION.md]
started: 2026-09-07
updated: 2026-09-07
---

## Current Test

number: 1
name: CR-01 修复后的白屏回归走查
expected: |
  在 /timestamp-converter 正向与反向各选「手动输入 IANA 时区…」，输入 UTC+8 与拼错地名（如 Foo/Bar）→ 显示结构化错误卡（role=alert）且页面其余部分正常可用，绝不白屏
awaiting: user response

## Tests

### 1. CR-01 修复后的白屏回归走查
expected: 在 /timestamp-converter 正向与反向各选「手动输入 IANA 时区…」，输入 UTC+8 与 Foo/Bar → 显示 role=alert 结构化错误卡，页面其余部分正常可用，绝不白屏
result: [pending]

### 2. 时间戳工具走查（6 步）
expected: ① 首页「开发辅助」分类显示「时间戳转换」卡片（含 NEW 徽标与 Clock 图标）；② 点击进入 /timestamp-converter；③ 输入 1735689600000 → 回显「识别为毫秒(12-14 位)」+ 原始输入 + 本地时间（+08:00 类偏移 + Asia/Shanghai 类时区名）+ UTC 时间；④ 输入 abc → 结构化错误卡显示不崩溃；⑤ 反向输入 2025-01-01 08:00:00 + Asia/Shanghai → 输出 1735689600000/1735689600；⑥ 点击复制 → 按钮出现「已复制」反馈，1500ms 后复位
result: [pending]

### 3. JSON 工具走查
expected: 双栏布局、树折叠手感、Array(n) 计数徽标与「JS 精度不安全」提示观感、错误卡行/列定位呈现、复制按钮反馈；粘贴含 script 标签的 JSON 字符串值确认仅显示为纯文本
result: [pending]

### 4. 双布局切换观感
expected: 从首页进入任一工具页（应切至克制 tool 布局，含返回首页导航与 max-w 容器），返回首页（应切回强风格 home 布局）；tool 区零 glow/动画侵入
result: [pending]

### 5. 真实浏览器端到端注入走查（deferred 至 Phase 5/8）
expected: 首个富文本工具接入后，向其粘贴 script/onerror 载荷确认仅渲染纯文本（SafeHtml 当前零消费者属 ARCH-04 结构性设计）
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
