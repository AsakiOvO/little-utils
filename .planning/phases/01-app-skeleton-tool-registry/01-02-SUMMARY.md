---
phase: 01-app-skeleton-tool-registry
plan: 02
subsystem: tools
tags: [tool-registry, timestamp-converter, dayjs, timezone, usecopy, vueuse, tdd, lucide, supply-chain-gate]

# Dependency graph
requires:
  - phase: 01-01
    provides: defineTool 契约 + 空注册表单一事实来源 + 注册表纯派生路由 + tool.layout 克制壳
provides:
  - "@lucide/vue@1.39.0 依赖(D-06 图标方案落地,供应链人工闸门通过)"
  - timestamp-converter 工具目录(detectUnit/fromTimestamp/toTimestamp 纯函数 service + 自注册 + 工具页)
  - useCopy 全站复制基建(useClipboard legacy:true,copiedDuring 1500)
  - "『新增工具 = 加目录 + 注册表一行』接入模式首次真实验证(Phase 5/8 批量样板)"
  - useCopy/服务层回归测试 16 用例(全套 36 绿)
affects: [01-03, 01-04, phase-2, phase-4, phase-5]

# Actuals (#2632)
actuals:
  tokens: 7736   # 30943 chars / 4 over realized diff (9 files, +652/-2)
  tasks: 3
  commits: 6

# Tech tracking
tech-stack:
  added: ["@lucide/vue@1.39.0"]
  patterns: [tool-self-registration-module, registry-line-integration, dayjs-utc-before-timezone, structured-error-result, copy-state-feedback-keyed]

key-files:
  created:
    - src/composables/useCopy.ts
    - src/composables/useCopy.test.ts
    - src/tools/timestamp-converter/index.ts
    - src/tools/timestamp-converter/timestamp-converter.service.ts
    - src/tools/timestamp-converter/timestamp-converter.service.test.ts
    - src/tools/timestamp-converter/timestamp-converter.vue
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/tools/index.ts

key-decisions:
  - "service 返回宽接口结构化错误({ok,error,各字段|null})而非 discriminated union:V7 不裸抛 + UI/测试无需类型收窄,非法输入一律 ok:false + error"
  - "useCopy 测试按 VueUse 14.4.0 真实语义锁定(legacy:true 下 isSupported 恒 true,降级为 copy 内部路径切换),修正计划中『isSupported=false 降级』的旧版库假设"
  - "时区下拉统一『下拉 + 手动输入 IANA』形态:Intl.supportedValuesOf 特性检测失败时仅剩常用列表,同一 UI 覆盖 A6 两条路径"
  - "识别回显(单位 + 原始输入)置于结果卡首行 + 全文复制含识别结论——透明性禁令(prohibitions)在 UI 层的落地形态"
  - "复制反馈用 lastCopiedKey + copied 组合判定:单一 copied ref 下多行按钮各自独立显示『已复制』"

patterns-established:
  - "工具自注册样板:defineTool({...icon: 组件引用, component: () => import('./x.vue')}) + 注册表 import + tools 数组一行,路由零手写"
  - "秒/毫秒位数启发判定 + 判定结论强制回显(防 1000 倍错判,TOOL-02 探针未决项的登记假设落地)"
  - "dayjs.extend(utc) 严格先于 extend(timezone)(T-01-07),tz.guess() 仅函数体内(Pitfall 3)"
  - "全站复制:useCopy() → useClipboard({legacy:true, copiedDuring:1500}),禁止裸调 navigator.clipboard"

requirements-completed: [TOOL-02]

coverage:
  - id: T1
    description: "/timestamp-converter 可直达刷新不 404,注册表派生零手写路由(成功标准 #1)"
    requirement: TOOL-02
    verification:
      - kind: integration
        ref: "command: dev server fetch http://localhost:5173/timestamp-converter → 200(SPA 回退);git diff 43bd903..HEAD 不含 src/router/routes.ts(零改动直接证据)"
      - kind: unit
        ref: "tests/src/router/routes.test.ts#routes — 派生一一对应不变量在非空注册表下成立"
    human_judgment: false
  - id: T2
    description: "时间戳 ↔ 日期时间双向转换,含本地时区/UTC/Z 偏移/IANA 时区名显示(成功标准 #2)"
    requirement: TOOL-02
    verification:
      - kind: unit
        ref: "tests/src/tools/timestamp-converter/timestamp-converter.service.test.ts — 13 用例(识别边界 6/正向 4/反向 2/往返 1)"
      - kind: other
        ref: "预渲染 dist/timestamp-converter.html 含工具页完整内容(49.73KiB);数值回显正确性需人工走查(human-check #3/#5)"
    human_judgment: true
    rationale: "UI 数值呈现与本地时区标签属浏览器运行时行为,自动化覆盖到 service 层与预渲染内容,页面级数值走查归 UAT"
  - id: T3
    description: "识别结果与原始输入回显;非法输入结构化报错(成功标准 #3 + transparency 禁令)"
    requirement: TOOL-02
    verification:
      - kind: unit
        ref: "service.test.ts — detectUnit 空/非数字/>14 位 invalid;fromTimestamp('abc')/toTimestamp('not-a-date') 返回 ok:false + error"
    human_judgment: true
    rationale: "错误卡视觉呈现(human-check #4)待 UAT"
  - id: T4
    description: "结果一键复制且有反馈(成功标准 #4)"
    requirement: TOOL-02
    verification:
      - kind: unit
        ref: "tests/src/composables/useCopy.test.ts — 3 用例(Clipboard API 路径/copiedDuring 1500ms 窗口复位/execCommand 降级不抛)"
      - kind: other
        ref: "vue 复制反馈(copied 驱动)与真实剪贴板权限行为(human-check #6)待 UAT"
    human_judgment: true
    rationale: "真机剪贴板权限为 manual-only(RESEARCH Validation Architecture)"
  - id: T5
    description: "『加目录 + 注册表一行』接入模式成立并记录(Phase 5 样板,成功标准 #5)"
    requirement: TOOL-02
    verification:
      - kind: other
        ref: "本计划执行即验证:src/tools/index.ts 仅 import + 数组一行;src/tools/timestamp-converter/index.ts defineTool 自注册;registry.test.ts 路径唯一性通过"
    human_judgment: false
  - id: T6
    description: "@lucide/vue 供应链人工闸门(T-01-SC,blocking-human 永不自动批准)"
    requirement: TOOL-02
    verification:
      - kind: other
        ref: "用户在 npmjs.com 人工核对发布者/仓库/README 导入示例后输入 approved(见 ## 供应链人工确认记录);lucide-vue-next 未混入(grep 退出码 1)"
    human_judgment: false

# Metrics
duration: 37 min
completed: 2026-09-04
status: complete
---

# Phase 1 Plan 2: 供应链闸门 + 时间戳转换完整切片 + useCopy Summary

**@lucide/vue 人工供应链闸门通过后安装 1.39.0;timestamp-converter 首个真实工具端到端(TDD RED→GREEN 13 用例 + 自注册 + 双向转换页);useCopy 全站复制基建(legacy 降级 3 用例);『加目录 + 注册表一行』模式首次验证,路由零手写——9 文件,全套 36 测试绿,lint/type-check/build 三卡口全过**

## Performance

- **Duration:** 37 min(含续接检查点恢复)
- **Started:** 2026-09-04T08:19:46Z
- **Completed:** 2026-09-04T08:56:59Z
- **Tasks:** 3(Task 1 checkpoint 于上一执行波人工批准后闭合;Task 2/3 本波执行)
- **Files modified:** 9(6 新建 + 3 修改)

## 供应链人工确认记录(Task 1 闸门输出)

| 项目 | 记录 |
|------|------|
| 检查点 | Task 1 `checkpoint:human-verify` gate="blocking-human"(永不自动批准,任何模式) |
| 确认时间 | 2026-09-04(用户于本计划续接前人工核对) |
| 包名 | `@lucide/vue`(npmjs.com/package/@lucide/vue) |
| 发布者 | lucide-icons 组织(publisher ericfennis / lucide-icons org) |
| 仓库 URL | github.com/lucide-icons/lucide |
| README 导入示例 | 原文形如 `import { Camera } from '@lucide/vue'`——按名导入图标组件,与 D-06『icon 字段存组件引用』一致 |
| 弃用包排除 | `lucide-vue-next` 未安装(grep package.json 退出码 1) |
| 安装版本 | 1.39.0(`corepack pnpm add @lucide/vue`,commit a8f69b0,lockfile 已提交) |
| 后续安装命令 | 仅使用已确认包名 @lucide/vue |

## Accomplishments

- **供应链闸门闭合(T-01-SC):** @lucide/vue 1.39.0 经 blocking-human 检查点人工批准后安装,import API 与 RESEARCH 假设 A2 一致(`import { Clock } from '@lucide/vue'` 编译通过)
- **首个真实工具端到端:** /timestamp-converter 经注册表派生自动可直达(dev fetch 200 + 刷新不 404);双向转换含本地时区/UTC/Z 偏移/IANA 时区名;识别结论 + 原始输入强制回显;非法输入结构化错误卡
- **TDD RED→GREEN:** service 测试 13 用例先行提交失败(10c1b1f),实现后全绿(acc4e78);覆盖秒/毫秒识别六组边界、UTC 目标时区偏移断言、Asia/Shanghai 精确毫秒/秒、本地时区往返一致、非法输入 ok:false
- **全站复制基建:** useCopy(useClipboard legacy:true + copiedDuring 1500)——Clipboard API 路径/复制窗口复位/execCommand 降级三用例回归;工具页复制按钮 copied 驱动反馈 + 「复制全部」格式化文本行
- **接入模式验证(Phase 5 样板):** src/tools/index.ts 仅 import + 数组一行;git diff 证实 src/router/routes.ts 零改动——ARCH-01 契约首次被真实数据检验
- **SSG 纪律:** vite-ssg build 预渲染 2 页(home + 工具页),零 "is not defined" 违纪;dayjs.tz.guess()/Intl 调用全部收敛在函数体内
- **全套验证:** vitest 36/36、type-check 0 错、lint 0 错(oxlint + eslint)、build EXIT 0

## Task Commits

Each task was committed atomically:

1. **Task 1(post-gate): @lucide/vue 安装** - `a8f69b0` (chore)
2. **Task 2 RED: service 失败测试先行** - `10c1b1f` (test)
3. **Task 2 GREEN: 工具完整切片(service + 自注册 + 页面 + useCopy + 注册表汇入)** - `acc4e78` (feat)
4. **Task 3: useCopy 回归测试** - `b9ea38a` (test)
5. **Task 3: 复制反馈 UX + 全文复制** - `94aac5f` (feat)
6. **Task 3: lint 卡口修复** - `130634d` (refactor)

## Files Created/Modified

- `src/tools/timestamp-converter/timestamp-converter.service.ts` - detectUnit(位数启发)/fromTimestamp(宽接口结构化返回)/toTimestamp;utc→timezone 插件顺序硬约束;tz.guess() 仅函数体内
- `src/tools/timestamp-converter/timestamp-converter.service.test.ts` - 13 用例:识别边界 6、正向 4(dayjs 自对照 + UTC 目标 + invalid 结构化)、反向 2(Asia/Shanghai 精确值 + ok:false)、往返 1
- `src/tools/timestamp-converter/index.ts` - defineTool 自注册样板(name/path/description/keywords/category/icon: Clock/component 懒加载/createdAt)
- `src/tools/timestamp-converter/timestamp-converter.vue` - 双向转换页:输入即算;结果卡(识别回显首行 + 本地/UTC/偏移/时区/目标行);目标时区与解析时区下拉(supportedValuesOf 特性检测 + 常用列表降级 + 手填 IANA);错误卡 role=alert;行复制按钮 copied 反馈 + 复制全部;全部文本插值渲染(零 HTML 字符串)
- `src/composables/useCopy.ts` - useClipboard({legacy:true, copiedDuring:1500}) 统一封装
- `src/composables/useCopy.test.ts` - 3 用例:navigator defineProperty 注入 clipboard/permissions + ClipboardItem stub;fake timers 窗口复位;execCommand 降级
- `src/tools/index.ts` - 注册表汇入 timestampConverter(一行 + import)
- `package.json` / `pnpm-lock.yaml` - @lucide/vue@1.39.0(^1.39.0 依赖,lockfile 供给链校验通过)

## Decisions Made

- service 返回宽接口结构化错误(全部字段 `|null` + ok/error)而非 discriminated union:非法输入不裸抛(V7),测试/UI 免类型收窄;copy 参数类型摩擦以 `?? ''` 兜底(ok:true 分支 service 保证非空)
- useCopy 测试按 VueUse 14.4.0 真实语义锁定而非计划假设(见 Deviation 1)
- 时区下拉统一「下拉 + 手动输入 IANA」选项形态:正常环境 400+ 全量列表、降级环境常用列表,同一 UI 覆盖 A6 双路径
- 识别回显(单位 + 原始输入)在结果卡首行,「复制全部」文本行包含识别结论——透明性禁令落到 UI
- 复制反馈 lastCopiedKey + copied 组合:单一 copied ref 下多行按钮独立反馈
- lint 卡口修复:vi.fn() 泛型参数(oxlint require-mock-type-parameters)与未用导入移除(eslint no-unused-vars)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] VueUse 14.4.0 useClipboard legacy 语义与计划假设漂移**
- **Found during:** Task 3(useCopy.test.ts 首轮 4 用例全红)
- **Issue:** 计划假设「模拟 isSupported 为 false 的降级路径」;实际 14.4.0 中 `legacy:true` 使 `isSupported = isClipboardApiSupported || legacy` **恒为 true**(降级是 copy 内部路径切换:permissions.query 状态不满足/clipboard.write 抛错 → execCommand),「isSupported=false」场景在该库版本下不存在
- **Fix:** 读 node_modules 实际实现后重写测试为真实契约三用例:Clipboard API 路径(defineProperty 注入 navigator.clipboard/permissions + ClipboardItem stub → clipboard.write)/copiedDuring 窗口复位(execCommand mock + fake timers)/legacy 降级(无 clipboard → execCommand('copy') 且不抛)——两意图(状态翻转复位 + 降级可用)全覆盖,断言符合库行为
- **Files modified:** src/composables/useCopy.test.ts(重写)
- **Verification:** vitest 3/3 绿,0 unhandled error(permissionStatus mock 补 EventTarget 形状)
- **Committed in:** b9ea38a

**2. [Rule 1 - Bug] copy 参数类型错误(ClipboardValue 不接受 null)**
- **Found during:** Task 2 verify(type-check 报 TS2345)
- **Issue:** 宽接口字段(string|null)直接传入 copy(row.value)
- **Fix:** forwardRows 构造时 `?? ''` 兜底(ok:true 分支 service 保证非空,纯类型层)
- **Files modified:** src/tools/timestamp-converter/timestamp-converter.vue
- **Committed in:** acc4e78

**3. [Rule 1 - Bug] lint 卡口 3+1 处错误**
- **Found during:** Task 3 整体验证(lint EXIT 1)
- **Issue:** oxlint require-mock-type-parameters(3 处 vi.fn 缺泛型);eslint no-unused-vars(vue 中 detectUnit 导入未用——重写 vue 时遗留)
- **Fix:** vi.fn 加泛型参数;移除未用导入
- **Files modified:** src/composables/useCopy.test.ts、src/tools/timestamp-converter/timestamp-converter.vue
- **Verification:** lint EXIT 0(oxlint 0 + eslint 0)
- **Committed in:** 130634d

**4. [Rule 3 - Blocking] 预渲染产物形态:计划验收写 dist/timestamp-converter/index.html,实际 vite-ssg 默认平铺输出 dist/timestamp-converter.html**
- **Found during:** Task 3 build 验收
- **Issue:** vite-ssg(vite 多页 rollup 输入)产物为平铺 html;目录形态需额外输出配置
- **Fix:** 采信构建工具默认形态——验收实质(新工具路由进入预渲染、构建不因浏览器 API 违纪失败)已达成;不改 vite 配置(目录/平铺属 Phase 3 部署形态决策,01-01 的 dist/index.html 验收即平铺形态)
- **Verification:** dist/timestamp-converter.html(49.73KiB)存在且含完整工具内容
- **Committed in:** 无代码改动(验收口径修正,记录于本 SUMMARY)

**Total deviations:** 4 auto-fixed(1 计划假设与库版本漂移、2 bug 类修正、1 验收口径修正)
**Impact on plan:** 未改变交付物与契约;useCopy 测试锁定的是更准确的库行为契约;无 scope creep。

## Issues Encountered

- `pnpm peers check` 报 eslint-plugin-oxlint@1.73.0 与 oxlint@1.74.0 小版本漂移——01-01 脚手架既有问题,与本计划文件无关(out of scope,未修;oxlint/eslint 实际运行均 0 错)
- happy-dom 的 navigator 无 clipboard/permissions 属性、document 无 execCommand、全局无 ClipboardItem——useCopy 测试需组合注入(说明纯 service 层测试无法覆盖剪贴板,组件级 mock 是正确层位)
- dev 模式下 fetch 首页 HTML 不含卡片文本(SPA 客户端渲染空壳)——非缺陷;卡片文本在 SSG 预渲染产物 dist/index.html 中验证通过(1 处命中)

## Known Stubs

None——无占位值、无未接线数据源、无 TODO/FIXME;空输入时结果区不渲染(刻意 UX,非 stub)。

## Threat Model Disposition

| Threat | Disposition | 证据 |
|--------|-------------|------|
| T-01-SC 供应链(@lucide/vue) | mitigate | Task 1 blocking-human 人工核对后安装;lockfile 提交;postinstall 零脚本 |
| T-01-05 用户输入回显 | mitigate | 全部输出 Vue 文本插值,零 v-html/innerHTML/HTML 字符串;错误卡含用户输入亦经插值转义 |
| T-01-07 dayjs 插件顺序 | mitigate | extend(utc) 先于 extend(timezone)(模块顶层硬约束)+ UTC/固定时区测试兜底 |
| T-01-06 剪贴板信息泄露 | accept | 仅写入用户主动复制内容,无网络/持久化 |

## Human-Check 清单(推迟至 phase 末 UAT 批量收口)

1. 首页『开发辅助』分类显示『时间戳转换』卡片(含 NEW 徽标与 Clock 图标)
2. 点击卡片进入 /timestamp-converter 工具页
3. 输入 1735689600000 → 回显「识别为毫秒(12-14 位)」+ 原始输入 + 本地时间(+08:00 类偏移 + Asia/Shanghai 类时区名)+ UTC 时间
4. 输入 abc → 结构化错误卡显示,不崩溃
5. 反向输入 2025-01-01 08:00:00 + Asia/Shanghai → 输出 1735689600000 / 1735689600
6. 点击复制 → 按钮出现「已复制」反馈(青色高亮),1500ms 后复位

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 01-03(XSS 消毒管线 + ESLint 卡口):本计划零 v-html/innerHTML,ESLint 基线干净;SafeHtml 唯一出口无既有消费者冲突
- Ready for 01-04(JSON 格式化):自注册样板(timestamp-converter/index.ts)直接复制;@lucide/vue 已装(Braces 图标可用)
- Phase 5 批量工具:『加目录 + 注册表一行』已验证;useCopy 可全站直接消费
- 注意:useCopy 测试锁定了 VueUse 14.4.0 语义,升级 @vueuse/core 大版本时需回归 useCopy.test.ts

---
*Phase: 01-app-skeleton-tool-registry*
*Completed: 2026-09-04*

## Self-Check: PASSED

- 6 个任务提交哈希(a8f69b0 / 10c1b1f / acc4e78 / b9ea38a / 94aac5f / 130634d)在 git log 中全部找到
- 7 个关键文件(6 代码 + SUMMARY 本身)磁盘存在性逐一验证,无 MISSING
- 整体验证复核:vitest 36/36、type-check 0 错、lint 0 错(oxlint+eslint)、vite-ssg build EXIT 0(dist/index.html + dist/timestamp-converter.html)、registry.test.ts(非空注册表不变量)通过
