---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-09-08T09:49:32.913Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | deviation | src/composables/useCopy.test.ts |  | 计划假设漂移:VueUse 14.4.0 legacy:true 使 isSupported 恒 true,测试按真实库语义锁定(降级为 copy 内部路径切换) | open |  | 2026-09-04T09:00:39.000Z |  |
| 2 | 01 | deviation | dist/timestamp-converter.html |  | 预渲染产物形态:vite-ssg 默认平铺 html,计划验收写的目录形态(index.html)按构建工具默认修正 | open |  | 2026-09-04T09:00:39.078Z |  |
| 3 | 02 | deviation | .planning/phases/02-design-system-a11y-baseline/deferred-items.md |  | D-23 引出的站内「减少动态效果」开关属产品决策(Rule 4),记录于 deferred-items.md 未实现 | open |  | 2026-09-08T09:49:32.913Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "01",
    "file": "src/composables/useCopy.test.ts",
    "line": null,
    "description": "计划假设漂移:VueUse 14.4.0 legacy:true 使 isSupported 恒 true,测试按真实库语义锁定(降级为 copy 内部路径切换)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T09:00:39.000Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "01",
    "file": "dist/timestamp-converter.html",
    "line": null,
    "description": "预渲染产物形态:vite-ssg 默认平铺 html,计划验收写的目录形态(index.html)按构建工具默认修正",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T09:00:39.078Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "02",
    "file": ".planning/phases/02-design-system-a11y-baseline/deferred-items.md",
    "line": null,
    "description": "D-23 引出的站内「减少动态效果」开关属产品决策(Rule 4),记录于 deferred-items.md 未实现",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T09:49:32.913Z",
    "resolved_at": null
  }
]
````
