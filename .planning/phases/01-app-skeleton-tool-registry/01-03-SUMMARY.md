---
phase: 01-app-skeleton-tool-registry
plan: 03
subsystem: ui
tags: [dompurify, xss, sanitize, safe-html, eslint, no-v-html, ignore-pattern, jsdom, tdd, arch-04]

# Dependency graph
requires:
  - phase: 01-01
    provides: eslint.config.ts flat config 基线(globalIgnores/multi-word 例外,无 no-v-html 规则)、vitest happy-dom 环境 + A4 按文件回退注释、dompurify@3.4.14 预装
  - phase: 01-02
    provides: 干净的 ESLint 基线(零 v-html/innerHTML,无既有消费者冲突)
provides:
  - sanitizeHtml() 全站唯一消毒入口(DOMPurify + 无 DOM 环境退化 escapeHtml,typeof window 每次调用时判定)
  - escapeHtml() 五字符转义纯函数(& < > " ')
  - SafeHtml 组件(src/ui/safe-html.vue,全站唯一允许 v-html 的组件,绑定名 sanitizedHtml)
  - ESLint 全站静态卡口(vue/no-v-html error + ignorePattern '^sanitized' 白名单 + no-restricted-syntax 封禁任意接收者 innerHTML/insertAdjacentHTML)
  - 注入样本回归集 12 用例(sanitize 9 + SafeHtml 组件 3,含无 window 退化分支显式覆盖)
  - jsdom 按文件回退基建(@vitest-environment jsdom pragma 模式 + jsdom 30.0.1 devDependency)
affects: [01-04, phase-2, phase-5, phase-8]

# Actuals (#2632)
actuals:
  tokens: 2960   # ~11.8K chars / 4 over realized diff (8 files, +271/-25)
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: [jsdom@30.0.1]
  patterns: [sanitize-html-sole-entry, safe-html-sole-vhtml-outlet, sanitized-prefix-lint-whitelist, no-dom-escape-fallback, per-file-jsdom-pragma, ast-selector-restricted-properties]

key-files:
  created:
    - src/utils/sanitize.ts
    - src/utils/sanitize.test.ts
    - src/ui/safe-html.vue
    - src/ui/safe-html.test.ts
  modified:
    - eslint.config.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "A4 假设落地:happy-dom 20.13.2 的 Node.prototype.nodeName 基类 getter 对元素返回空串,DOMPurify 3.4.14 为防 clobber 缓存该 getter → 所有元素 tagName 读空被整体解包——按计划预授权路径安装 jsdom 30.0.1 并对 sanitize/safe-html 两个测试文件加 @vitest-environment jsdom 按文件回退(测试运行验证,非注释声明)"
  - "innerHTML/insertAdjacentHTML 红线用 no-restricted-syntax AST 选择器(MemberExpression[property.name=...])实现而非计划字面的 no-restricted-properties:后者需固定对象名,无法表达'任意接收者'——意图(红线静态化)不变,且经临时探针证明有牙"
  - "唯一出口三重收敛:ESLint error 级 + '^sanitized' 白名单绑定名(只能来自 sanitizeHtml() 返回值) + 注入样本测试集;fail-first 双探针(v-html/innerHTML)证明卡口有牙后撤销"
  - "sanitizeHtml 非字符串输入返回空串而非抛错(V7 错误处理纪律);escapeHtml 用 Record 映射 + ?? c 避免非空断言"

patterns-established:
  - "HTML 字符串渲染唯一通道:任何富文本 → sanitizeHtml() → SafeHtml 组件;组件外 v-html 必被 vue/no-v-html 命中,绑定名必须以 sanitized 开头(白名单触发条件即命名契约)"
  - "无 DOM 退化模式:涉及 DOM 的共享函数以 typeof window 每次调用时判定,vite-ssg 构建期(Node)走纯转义/安全退化分支"
  - "按文件测试环境回退:特定测试文件首行 // @vitest-environment jsdom,全局 vitest 环境保持 happy-dom 不变"
  - "fail-first 卡口证明:临时违规探针文件触发 lint error(exit 1)后撤销,结果记录进 SUMMARY"

requirements-completed: [ARCH-04]

coverage:
  - id: D1
    description: sanitizeHtml 注入样本集中和——script 标签/img onerror/javascript: 伪协议/内联 onclick 全部剥离,无害文本与基本标记保留(CONTEXT specifics 验收标准的自动化形态)
    requirement: ARCH-04
    verification:
      - kind: unit
        ref: "tests/src/utils/sanitize.test.ts — 注入样本集 5 用例 + escapeHtml 2 用例(9 tests 全绿)"
        status: pass
    human_judgment: false
  - id: D2
    description: 无 DOM 环境(vite-ssg 构建/Node)退化为纯转义且被显式测试覆盖(T-01-08)
    requirement: ARCH-04
    verification:
      - kind: unit
        ref: "tests/src/utils/sanitize.test.ts — vi.stubGlobal('window', undefined) 用例:输出无尖括号标签、载荷呈转义文本"
        status: pass
      - kind: integration
        ref: "command: corepack pnpm build — vite-ssg 预渲染 EXIT 0,无 window 守卫缺失崩溃"
        status: pass
    human_judgment: false
  - id: D3
    description: SafeHtml 挂载注入载荷后组件 DOM 内无可执行节点(无 script 元素、无 on* 属性),无害内容正常渲染
    requirement: ARCH-04
    verification:
      - kind: unit
        ref: "tests/src/ui/safe-html.test.ts — mount 注入载荷断言 3 用例全绿(jsdom)"
        status: pass
    human_judgment: false
  - id: D4
    description: ESLint 静态卡口全局生效且经 fail-first 验证有牙(v-html + innerHTML 双探针)
    requirement: ARCH-04
    verification:
      - kind: other
        ref: "command: eslint 探针 exit 1('v-html' directive can lead to XSS attack / 自定义 message)→ 撤销探针 → corepack pnpm lint exit 0(oxlint 0 + eslint 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: 全站唯一出口收敛:grep v-html src/ 仅 safe-html.vue(组件本体)与其测试文件命中;innerHTML/insertAdjacentHTML 非注释命中 0;两个 Phase 1 工具零 HTML 字符串路径(vnode 优先)
    requirement: ARCH-04
    verification:
      - kind: other
        ref: "grep -rln v-html src/ → 仅 src/ui/safe-html.vue + src/ui/safe-html.test.ts;grep innerHTML|insertAdjacentHTML 非注释命中 0;全套 vitest 48/48 回归"
        status: pass
    human_judgment: false
  - id: D6
    description: 真实浏览器端到端注入走查(向未来富文本工具粘贴 script/onerror 载荷仅渲染纯文本)——SafeHtml 本阶段刻意零消费者,走查随 Phase 5/8 首个富文本工具接入收口
    requirement: ARCH-04
    verification: []
    human_judgment: true
    rationale: "SafeHtml 尚无真实消费者(Phase 1 两工具全走 vnode 插值路径),组件级 jsdom 测试已覆盖消毒正确性;真实浏览器 + 真实工具页的端到端走查只能在首个消费者存在时进行,归 Phase 5/8 UAT"

# Metrics
duration: 23 min
completed: 2026-09-04
status: complete
---

# Phase 1 Plan 3: XSS 消毒渲染管线(sanitizeHtml + SafeHtml 唯一出口 + ESLint 卡口) Summary

**sanitizeHtml(DOMPurify + 无 DOM 退化 escapeHtml)唯一消毒入口 + SafeHtml 全站唯一 v-html 出口 + ESLint vue/no-v-html '^sanitized' 白名单与 innerHTML 禁令静态卡口,注入样本回归集 12 用例全绿,fail-first 双探针证明卡口有牙——ARCH-04 两级收敛完成,vite-ssg 构建期退化路径被构建验证**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-04T09:05:56Z
- **Completed:** 2026-09-04T09:29:26Z
- **Tasks:** 2(Task 1 TDD RED→GREEN + tracer 门复跑;Task 2 auto)
- **Files modified:** 8(4 新建 + eslint.config.ts + package.json/pnpm-lock.yaml[jsdom 回退])

## Accomplishments

- **消毒管线就位(ARCH-04):** `sanitizeHtml()` 全站唯一消毒入口——DOMPurify 3.4.14 + `ALLOWED_URI_REGEXP` 仅放行 https?/mailto/tel;无 DOM 环境(vite-ssg 预渲染/Node 测试)按 `typeof window` 每次调用时判定退化为 `escapeHtml` 纯转义(T-01-08),构建期不失败
- **SafeHtml 唯一出口:** `src/ui/safe-html.vue` 全站唯一允许 v-html 的组件,`computed sanitizedHtml = sanitizeHtml(props.html)`——绑定名以 sanitized 开头即 lint 白名单触发条件,出口被 lint + 命名双重收敛
- **ESLint 静态卡口:** `vue/no-v-html: ['error', { ignorePattern: '^sanitized' }]` 全站 error 级;`no-restricted-syntax` 封禁任意接收者的 innerHTML/insertAdjacentHTML(code review 红线静态化)
- **注入样本回归集 12 用例全绿:** script 标签/img onerror/javascript: 伪协议/内联 onclick 全部中和、无害文本与基本标记保留、vi.stubGlobal 无 window 分支显式覆盖、组件级 mount 注入断言(无 script 元素/无 on* 属性)
- **fail-first 卡口有牙证明:** 临时违规探针(v-html + innerHTML 各一)均触发 eslint error(exit 1)后撤销,随后全套 lint 0 错
- **全套验证:** vitest 48/48(7 文件,36 既有 + 12 新增)、lint 0 错、type-check 0 错、vite-ssg build EXIT 0(预渲染 2 页)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: 注入样本测试集先行(失败)** - `f9fb05c` (test)
2. **Task 1 GREEN: 消毒函数管线 + jsdom 按文件回退** - `3cd6b98` (feat)
3. **Task 2: SafeHtml 唯一出口 + ESLint 白名单卡口 + 组件测试** - `091c6de` (feat)

## fail-first 卡口验证记录(计划 output 要求)

| 探针 | 文件 | 触发规则 | eslint 退出码 | 撤销 |
|------|------|----------|---------------|------|
| 非 sanitized 绑定的 `v-html="raw"` | src/ui/lint-gate-probe.vue(临时) | vue/no-v-html "'v-html' directive can lead to XSS attack" | 1(error) | 已删除 |
| `el.innerHTML = html` 任意接收者 | src/ui/lint-gate-probe-innerhtml.ts(临时) | no-restricted-syntax(自定义 message:禁止直接读写 innerHTML…唯一出口) | 1(error) | 已删除 |

撤销后 `corepack pnpm lint` exit 0(oxlint 0 + eslint 0)——卡口平时静默、违规必报。

## Files Created/Modified

- `src/utils/sanitize.ts` - sanitizeHtml(DOMPurify + typeof window 退化分支 + 非字符串空串)/escapeHtml(五字符 Record 映射);ALLOWED_URI_REGEXP 仅放行 https?/mailto/tel
- `src/utils/sanitize.test.ts` - 9 用例:注入样本集 5(script/img onerror/javascript:/onclick/无害保留)+ escapeHtml 2 + 无 window 退化 1 + 非字符串不裸抛 1;首行 @vitest-environment jsdom
- `src/ui/safe-html.vue` - SafeHtml 唯一出口组件:props.html → computed sanitizedHtml,模板唯一一次 v-html + eslint-disable-next-line 注释(RESEARCH Pattern 5 形态)
- `src/ui/safe-html.test.ts` - 3 用例:mount 注入载荷无 script 元素/遍历属性无 on*/伪协议剥离;无害内容正常渲染;jsdom 回退
- `eslint.config.ts` - ARCH-04 卡口规则块(vue/no-v-html + ignorePattern '^sanitized' + no-restricted-syntax 双选择器),置于 oxlint 块之后保证优先级
- `package.json` / `pnpm-lock.yaml` - jsdom 30.0.1 devDependency(A4 回退依赖)

## Decisions Made

- **A4 假设按计划落地:** happy-dom 20.13.2 与 DOMPurify 3.4.14 不兼容——探针诊断:DOMParser/createHTMLDocument 解析层正常(p 正确成节点、allowedTags.p/b 均存在),根因是 DOMPurify 为防 prototype clobber 缓存 `Node.prototype` 上的 nodeName getter,而 happy-dom 把真实实现覆盖在 `Element.prototype`(基类 getter 对元素返回空串)→ 所有元素 tagName 读空、被判不允许后"解包"(p 标签被剥、script 文本存活)。按计划 action 第 3 步预授权路径:安装 jsdom 30.0.1(官方支持在案,01-01 已注明"真需回退时再装"),两个测试文件首行 `// @vitest-environment jsdom`,回退本身经测试运行验证
- **innerHTML 红线机制等价替换:** 计划字面的 no-restricted-properties 需固定 object 名(`{object: 'el', ...}`),无法表达"任意接收者";改用 no-restricted-syntax 的 `MemberExpression[property.name='innerHTML'/'insertAdjacentHTML']` AST 选择器——意图(红线静态化)不变,且有牙(探针 exit 1 验证)
- **卡口规则块置于 oxlint 块之后:** eslint-plugin-oxlint 会将 oxlint 已覆盖的规则置 off,卡口块后置保证 vue/no-v-html 与 no-restricted-syntax 的 error 配置取得优先级(oxlint 未实现 no-v-html,预检已确认无双报告)
- **service 纪律落地:** sanitizeHtml 非字符串输入返回空串(错误不裸抛);escapeHtml 用 Record 映射 + `?? c` 规避非空断言

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A4 假设落地:happy-dom × DOMPurify 不兼容,jsdom 按文件回退**
- **Found during:** Task 1 GREEN(首轮 2/9 失败:p 被解包、script 文本存活)
- **Issue:** happy-dom 20.13.2 的 `Node.prototype.nodeName` 基类 getter 对元素返回空串(DOMPurify 缓存该 getter 做 clobber-safe 读取)→ DOMPurify 3.4.14 将所有元素 tagName 识别为空、按"不允许"解包处理
- **Fix:** 按计划预授权回退路径安装 jsdom 30.0.1 devDependency,sanitize.test.ts 与 safe-html.test.ts 首行加 `// @vitest-environment jsdom`(全局 vitest 环境保持 happy-dom 不变);回退经测试运行验证(9/9 + 3/3 绿)而非注释声明(flagged_assumptions 要求)
- **Files modified:** src/utils/sanitize.test.ts、src/ui/safe-html.test.ts、package.json、pnpm-lock.yaml(后两者为计划 files_modified 之外,属预授权回退的必要伴随)
- **Verification:** `corepack pnpm vitest run src/utils/sanitize.test.ts` 9/9、safe-html 3/3、全套 48/48;build/lint/type-check 全绿
- **Committed in:** 3cd6b98(Task 1 GREEN)+ 091c6de(safe-html 侧 pragma)

**2. [Rule 2 - Missing Critical] innerHTML/insertAdjacentHTML 红线机制:no-restricted-properties → no-restricted-syntax**
- **Found during:** Task 2(eslint.config.ts 卡口实现时)
- **Issue:** no-restricted-properties 的每个条目需固定 `object` 名,无法覆盖"任意接收者 + 危险属性"(`el.innerHTML` 的 el 是任意变量),照字面实现会让红线形同虚设
- **Fix:** 用 no-restricted-syntax AST 选择器表达同一意图,带 ARCH-04 出口指引的自定义 message;fail-first 探针证明报错有效
- **Files modified:** eslint.config.ts
- **Verification:** 临时探针 exit 1 + 自定义 message 输出;撤销后 lint 0 错
- **Committed in:** 091c6de

---

**Total deviations:** 2 auto-fixed(1 blocking[A4 预授权回退] + 1 机制等价替换)
**Impact on plan:** 无 scope creep——jsdom 是计划明文预授权的回退路径(assumptions/RESEARCH A4),卡口机制替换系原机制无法表达意图;交付物与 ARCH-04 契约不变。

## Issues Encountered

- happy-dom 下探针诊断发现 DOMPurify 的 hoist(解包提升子节点)变更会令 happy-dom 的 NodeIterator 提前终止(BODY/P 被访问、B 未达)——与 nodeName getter 空串同属 happy-dom 原型链/迭代器实现与 DOMPurify 防御机制不兼容的表现,jsdom 下均不复现
- 临时探针曾观察到 happy-dom 的 NodeIterator 包含 walk root(body)本身,与 WHATWG NodeIterator 语义不符——同根因,随 jsdom 回退一并规避

## Known Stubs

None——无占位值、无未接线数据源、无 TODO/FIXME;SafeHtml 本阶段刻意零消费者(Phase 1 两工具全走 vnode 插值),属 ARCH-04 的结构性设计而非 stub。

## Threat Model Disposition

| Threat | Disposition | 证据 |
|--------|-------------|------|
| T-01-01 v-html 旁路 | mitigate | 1) vnode 优先(两工具零 HTML 字符串路径,D5 扫描证据);2) SafeHtml 唯一出口;3) vue/no-v-html error + '^sanitized' 白名单全站生效;4) 注入样本集 12 用例回归;5) fail-first 双探针证明卡口有牙 |
| T-01-08 无 window 构建期崩溃 | mitigate | typeof window 守卫 + escapeHtml 退化分支 + vi.stubGlobal 显式测试;vite-ssg build EXIT 0 |
| T-01-09 DOMPurify 供应链 | mitigate | cure53 官方(01-01 legitimacy Approved),版本锁定于 lockfile(^3.4.14 → 3.4.14 实装) |
| T-01-SC npm 依赖安装 | mitigate | 承接 01-01/01-02 处置;本计划新增 jsdom 为 RESEARCH A4 在案回退项(create-vue 模板默认依赖,非新增未知包),lockfile 提交 |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 01-04(JSON 格式化):tokenizer/service 纯函数 + vnode 渲染路径(零 v-html);CodeMirror 只进工具 chunk;本计划的 lint 卡口将自动看护 01-04 的一切新增代码
- SafeHtml 零消费者为刻意状态:Phase 5/8 一切"需要渲染富文本"的工具只有 sanitizeHtml → SafeHtml 这一条合法通道
- jsdom 回退基建就位:后续涉及 DOMPurify 的测试按文件加 pragma 即可;若未来升级 happy-dom 修复 nodeName 原型链问题,可移除 pragma 回 happy-dom(更快),建议升级时跑本计划 12 用例回归
- 注意:eslint.config.ts 的卡口规则块位于 oxlint 块之后,未来重排 flat config 时勿移到 oxlint 块之前(会被置 off)

---
*Phase: 01-app-skeleton-tool-registry*
*Completed: 2026-09-04*

## Self-Check: PASSED

- 4 个关键代码文件 + SUMMARY 本身磁盘存在性逐一验证,无 MISSING
- 3 个任务提交哈希(f9fb05c / 3cd6b98 / 091c6de)在 git log 中全部找到
- 计划级 verification 复核:vitest 48/48(7 文件)、type-check 0 错、lint 0 错(oxlint+eslint)、vite-ssg build EXIT 0(dist/index.html + dist/timestamp-converter.html)
- Task 验收标准全过:sanitize.ts 四要素 grep、safe-html.vue 模板 v-html 唯一用法、eslint.config.ts ignorePattern/'^sanitized' 规则键、fail-first 双探针记录

