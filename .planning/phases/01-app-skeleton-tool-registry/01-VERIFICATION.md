---
phase: 01-app-skeleton-tool-registry
verified: 2026-09-07T03:40:11Z
status: gaps_found
score: 21/22 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "秒/毫秒识别结果与原始输入必须回显;非法输入显示结构化错误信息而非崩溃(TOOL-02 + P3 透明性)——01-02 must_haves #4"
    status: failed
    reason: |
      CR-01(BLOCKER,实证复现):timestamp-converter 手填 IANA 时区输入非法值(如 UTC+8——业界最常见的人类写法,
      UI 以「手动输入 IANA 时区…」自由文本框显式引导)时,service 的 dayjs.tz 调用抛出未捕获 RangeError:
      "Invalid time zone specified: UTC+8"(node 实证:Foo/Bar、UTC+8 正反向三条路径全部必抛)。
      调用点位于 timestamp-converter.vue 的 computed(forwardResult L244-246 / reverseResult L292-296),
      异常从渲染期抛出,组件无 onErrorCaptured,Vue 3 默认行为卸载组件树 → 整页白屏,用户无法完成任何操作。
      三重违反:① 01-02 must_haves truth #4「非法输入显示结构化错误信息而非崩溃」;
      ② 01-02 prohibitions(transparency)「非法输入必须给出结构化错误而非静默吞掉或臆测值」;
      ③ 服务层两个 Result 接口的头条注释自声明的 V7 契约「非法输入返回 ok:false + error,不裸抛」。
      同时 13 个服务测试全部只覆盖有效时区('UTC'/'Asia/Shanghai')与无时区调用——测试盲区恰好掩盖该 bug,
      这是「测试全绿 ≠ 目标达成」的典型案例。直接违背阶段目标「用户可立即使用首批 2 个工具完成真实操作」。
    artifacts:
      - path: "src/tools/timestamp-converter/timestamp-converter.service.ts"
        issue: "fromTimestamp L87 d.tz(tz) 与 toTimestamp L93 dayjs.tz(input, tz) 均未校验 tz 参数,非法时区抛 RangeError"
      - path: "src/tools/timestamp-converter/timestamp-converter.vue"
        issue: "effectiveForwardTz/effectiveDtTz 将手填自由文本仅 trim 后原样传入 service;调用点在 computed(L244-246/L292-296),异常从渲染期抛出;组件无 onErrorCaptured 兜底"
    missing:
      - "service 层用 new Intl.DateTimeFormat('en-US',{timeZone:tz}) try/catch 校验 tz,非法时返回与现有形态一致的 ok:false 结构化错误(01-REVIEW.md CR-01 已给完整修复代码)"
      - "补测试:fromTimestamp('0','UTC+8').ok === false;toTimestamp('2025-01-01 08:00:00','Foo/Bar').ok === false 且不抛异常"
      - "修复后复验:UI 手填 UTC+8 显示 role=alert 错误卡(错误卡 UI 已就绪,service 收敛后白屏即消失)而非白屏"
  - truth: "秒/毫秒识别结果与原始输入必须回显;非法输入显示结构化错误信息而非崩溃——service 层伴生缺陷(WR-01)"
    status: partial
    reason: |
      detectUnit L51 合法性检测用 ts.trim(),但 L52 位数判定用未 trim 的原始串——
      detectUnit(' 1735689600 ') 返回 'ms'(10 位秒级被错判为毫秒 → 结果落在 1970 年代,1000 倍错判,node 实证;
      detectUnit('  1735689600000 ') 更被误判 'invalid')。当前 UI 层(tsInput.value.trim())恰好掩盖了该 bug,
      用户可见路径未被触发,故不构成 must-have 的用户侧违反;但 service 是 Phase 5/8 批量工具复用的全站公共 API,
      其契约注释(L47)明确承诺防「1000 倍错判」。现有测试无带空白用例,与 CR-01 同属测试盲区。
    artifacts:
      - path: "src/tools/timestamp-converter/timestamp-converter.service.ts"
        issue: "detectUnit L52 应使用 trim 后的变量判定位数(合法性检测与位数判定使用不同变量)"
    missing:
      - "收窄为单一 trim 后变量(01-REVIEW.md WR-01 已给修复代码);补 detectUnit(' 1735689600 ')==='s' 与 detectUnit('\\t1735689600000\\n')==='ms' 回归用例"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "时间戳工具走查(harvest 自 01-02 Task 3 human-check,共 6 项):① 首页『开发辅助』分类显示『时间戳转换』卡片(含 NEW 徽标与 Clock 图标);② 点击进入 /timestamp-converter;③ 输入 1735689600000 → 回显『识别为毫秒(12-14 位)』+ 原始输入 + 本地时间(+08:00 类偏移 + Asia/Shanghai 类时区名)+ UTC 时间;④ 输入 abc → 结构化错误卡显示不崩溃;⑤ 反向输入 2025-01-01 08:00:00 + Asia/Shanghai → 输出 1735689600000/1735689600;⑥ 点击复制 → 按钮出现『已复制』反馈,1500ms 后复位"
    expected: "六项全部符合描述;本地时区数值随运行环境正确"
    why_human: "暗色底观感、识别回显完整性、复制反馈等是浏览器运行时视觉/交互行为,SSG 产物与组件测试只能覆盖数据层"
  - test: "CR-01 修复后的白屏回归走查:在 /timestamp-converter 正向与反向各选『手动输入 IANA 时区…』,输入 UTC+8 与拼错地名(如 Foo/Bar)"
    expected: "显示结构化错误卡(role=alert)且页面其余部分正常可用,绝不白屏;修复前版本此操作必现白屏(node 已实证 RangeError)"
    why_human: "Vue 渲染期异常导致的组件树卸载只有真实浏览器可见;修复验证必须走查此路径"
  - test: "JSON 工具走查(harvest 自 01-04 D3,留待 verify-work):双栏布局、树折叠手感、Array(n) 计数徽标与『JS 精度不安全』提示观感、错误卡行/列定位呈现、复制按钮反馈;粘贴含 <script> 的 JSON 字符串值确认仅显示为纯文本"
    expected: "视觉与交互符合 D-02 双栏设计;脚本载荷零执行"
    why_human: "交互充分性与视觉观感无自动化断言"
  - test: "双布局切换观感:从首页进入任一工具页(应切至克制 tool 布局,含返回首页导航与 max-w 容器),返回首页(应切回强风格 home 布局)"
    expected: "切换正确,tool 区零 glow/动画侵入(Pitfall 4)"
    why_human: "SSR 产物已证明切换逻辑正确执行(预渲染 HTML 含 tool 布局 chrome),但浏览器端观感与过渡需人工确认"
  - test: "真实浏览器端到端注入走查(01-03 D6,刻意 deferred 至 Phase 5/8 首个富文本工具接入时收口):SafeHtml 当前零消费者属 ARCH-04 结构性设计,首个富文本消费者出现后向其粘贴 script/onerror 载荷确认仅渲染纯文本"
    expected: "消毒管线在真实工具页生效"
    why_human: "无消费者可走查;组件级 jsdom 测试(3 用例)已覆盖消毒正确性"
---

# Phase 1: 应用骨架与工具注册表契约 验证报告

**Phase Goal:** 用户可访问站点并立即使用首批 2 个工具(JSON 格式化、时间戳转换)完成真实操作;"注册表 → 路由/导航/分包"派生机制与 XSS 消毒渲染管线作为全站契约定型,后续工具零改动接入
**Verified:** 2026-09-07T03:40:11Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### User Story(MVP Mode)用户流覆盖

Phase mode: mvp(SKELETON.md 用户故事)。逐步核验:

| # | 用户流步骤 | 预期 | 代码库证据 | 状态 |
|---|-----------|------|-----------|------|
| 1 | 打开站点(dev / SSG 产物) | 首页渲染分类网格 | `dist/index.html` 预渲染含『时间戳转换』『JSON 格式化』『开发辅助』卡片文本(实测 grep 命中);home.vue 消费 `toolsByCategory()` | ✓ |
| 2 | 进入 /json-formatter 完成格式化/压缩/校验 | 长 ID 零精度丢失 | tokenizer 30 用例含 `9052710354240385291` 原文断言;`dist/json-formatter.html` 预渲染含真实内容;零数值转换调用(源码核查) | ✓ |
| 3 | 进入 /timestamp-converter 完成双向转换(含时区) | 有效输入正确转换并回显 | 服务 13 用例(正向 4/反向 2/往返 1/识别 6);`dist/timestamp-converter.html` 预渲染含完整工具内容 | ✓(有效输入)/ ✗(非法时区输入白屏,见 Gaps) |
| 4 | 一键复制结果 | 复制成功有反馈 | useCopy(useClipboard legacy:true)3 用例 + 两工具页 copied 驱动反馈 | ✓ |
| 5 | 全程数据不出浏览器 | 零网络请求 | grep `src/` 零 fetch/XHR/axios/遥测(实测);01-01 privacy 禁令成立 | ✓ |
| 6 | 后续工具零改动接入 | 加目录 + 注册表一行 | routes.ts 纯派生(tools.map + 404 置尾);两个真实工具经此模式接入且 `src/router/routes.ts` 零手写(SUMMARY git diff 证据 + registry.test 路径唯一性) | ✓ |

**结论:用户流第 3 步存在一个由 UI 显式引导的崩溃路径(手填非法时区 → 白屏),阶段目标未完全达成。**

### Observable Truths(Roadmap Success Criteria + 4 个 PLAN must_haves 合并,共 22 条)

| # | Truth | 来源 | 状态 | Evidence |
|---|-------|------|------|----------|
| 1 | JSON 工具格式化/压缩/校验,长数字 ID 不丢精度 | Roadmap SC-1 | ✓ VERIFIED | json-formatter.service.test.ts 30 用例(含 2^53 原文/负数/指数断言);源码零 Number()/parseFloat() 中转;预渲染页含内容 |
| 2 | 时间戳双向转换含时区显示 | Roadmap SC-2 | ✓ VERIFIED | 服务 13 用例(UTC 目标时区偏移断言、Asia/Shanghai 精确值、往返一致);UI 完整渲染五类字段 |
| 3 | 每工具独立 URL 直达、刷新不 404、重依赖不进首屏 | Roadmap SC-3 | ✓ VERIFIED | dist/json-formatter.html + dist/timestamp-converter.html 预渲染存在(静态文件服务即不 404);`check-chunks.mjs` 实测 `OK: chunk budget pass`;CM 引用仅在 json-formatter 工具目录(grep) |
| 4 | 输出一键复制;脚本载荷仅渲染纯文本 | Roadmap SC-4 | ✓ VERIFIED | useCopy 3 用例;注入样本 12 用例全绿;v-html 全站仅 safe-html.vue(grep);ESLint 卡口在源码(vue/no-v-html error + '^sanitized' 白名单 + innerHTML/insertAdjacentHTML AST 禁令) |
| 5 | type-check 与 vite-ssg build 全绿,dist/index.html 产出 | 01-01 #1 | ✓ VERIFIED | 本次实测:type-check exit 0 / build exit 0 / dist/index.html 4.03KiB |
| 6 | 路由表纯派生:home + tools.map + 404 置尾,回归保护 | 01-01 #2 | ✓ VERIFIED | routes.ts L9-23 与契约逐字吻合;routes.test.ts 4 用例(home 首位/404 置尾/派生一一对应/meta) |
| 7 | 注册表不变量测试(含空注册表合法用例) | 01-01 #3 | ✓ VERIFIED | registry.test.ts 11 用例;assertRegistryInvariants 四类不变量(L36-39) |
| 8 | App.vue 按 route.meta.layout 切换双布局 | 01-01 #4 | ✓ VERIFIED | App.vue computed 切换;SSR 构建期真实执行——dist/timestamp-converter.html 含 tool 布局 chrome(『返回首页』导航) |
| 9 | home 消费 toolsByCategory(),空态而非白屏 | 01-01 #5 | ✓ VERIFIED | home.vue L47;dist/index.html 真实渲染两工具卡片 |
| 10 | @theme oklch 三色令牌 + 暗色语义底;dark 声明未启用 | 01-01 #6 | ✓ VERIFIED | tokens.css:@custom-variant dark(L6,仅声明)+ 3 霓虹色 + 6 语义变量 + 2 glow 阴影 |
| 11 | 首页卡片 + /timestamp-converter 直达刷新不 404 | 01-02 #1 | ✓ VERIFIED | dist/index.html 含卡片;dist/timestamp-converter.html 预渲染(49.73KiB 完整内容) |
| 12 | 正向转换显示本地/UTC/Z 偏移/IANA 时区名 | 01-02 #2 | ✓ VERIFIED | service L79-88 五字段;13 用例中 4 正向用例断言 |
| 13 | 反向转换目标时区 + 毫秒/秒双粒度 | 01-02 #3 | ✓ VERIFIED | toTimestamp 返回 {ms, sec};Asia/Shanghai 用例精确断言 |
| 14 | **识别回显 + 非法输入结构化错误而非崩溃** | 01-02 #4 | ✗ **FAILED** | **CR-01:手填非法时区(UTC+8)→ RangeError → 渲染期白屏(node 实证复现三条路径);详见 Gaps** |
| 15 | 转换结果一键复制 + 已复制反馈(legacy 降级可用) | 01-02 #5 | ✓ VERIFIED | useCopy.test.ts 3 用例(状态翻转/1500ms 复位/execCommand 降级);UI lastCopiedKey 多行独立反馈 |
| 16 | 新增工具 = 加目录 + 注册表一行,路由零手写 | 01-02 #6 | ✓ VERIFIED | 两工具经此模式接入;routes.ts 无任何手写工具路由;registry.test 路径唯一性通过 |
| 17 | sanitizeHtml 注入样本集全部中和,无害文本保留 | 01-03 #1 | ✓ VERIFIED | sanitize.test.ts 9 用例(script/img onerror/javascript:/onclick/无害保留)全绿(jsdom) |
| 18 | SafeHtml 挂载载荷后无可执行节点 | 01-03 #2 | ✓ VERIFIED | safe-html.test.ts 3 用例(无 script 元素/无 on* 属性) |
| 19 | ESLint 唯一出口卡口生效(fail-first 验证) | 01-03 #3 | ✓ VERIFIED | eslint.config.ts L54-71 规则块在源码;SUMMARY 记录双探针(v-html + innerHTML)exit 1 后撤销;本次实测 lint exit 0 |
| 20 | 无 DOM 环境退化为纯转义且被测试覆盖 | 01-03 #4 | ✓ VERIFIED | sanitize.ts L24 typeof window 守卫;vi.stubGlobal 用例;build exit 0(构建期实际走到该分支) |
| 21 | 2^53 保真/键序/重复键/行列定位(BOM) | 01-04 #1-2 | ✓ VERIFIED | tokenizer 30 用例含六组场景;尾逗号显式报错不静默修正(源码 L322-324) |
| 22 | 双栏共享解析 + CM6 仅本工具 chunk + check-chunks 卡口 | 01-04 #3-6 | ✓ VERIFIED | json-formatter.vue parsed computed 单源;check-chunks 实测 OK;CM chunk 独立存在(dist/assets/json-formatter-*.js) |

**Score:** 21/22 truths verified(0 present-behavior-unverified)

### Required Artifacts

全部 32 个 src 文件 + scripts/check-chunks.mjs 存在且实质性(逐一读取核查,无 stub):

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/tools/tool.ts` | defineTool 契约 + icon: Component | ✓ VERIFIED | D-06 契约字段;isNew 30 天派生 |
| `src/tools/index.ts` | 单一事实来源 + 不变量 | ✓ VERIFIED | tools 含两真实工具;四类不变量;toolsByCategory |
| `src/router/routes.ts` | 纯派生路由 | ✓ VERIFIED | home + tools.map + 404 置尾;加载即断言 |
| `src/router/index.d.ts` | RouteMeta 增强 | ✓ VERIFIED | layout/tool 字段 |
| `src/utils/sanitize.ts` / `src/ui/safe-html.vue` | 消毒管线 | ✓ VERIFIED | DOMPurify + 无 DOM 退化;唯一 v-html 出口 |
| `src/composables/useCopy.ts` | 复制基建 | ✓ VERIFIED | useClipboard legacy:true |
| `src/tools/timestamp-converter/*` | 工具 1 | ⚠️ 大体 VERIFIED,service 存在 CR-01/WR-01 缺陷 | 见 Gaps |
| `src/tools/json-formatter/*` | 工具 2 | ✓ VERIFIED | tokenizer/CM/树/双栏全部就位 |
| `scripts/check-chunks.mjs` | 分包卡口 | ✓ VERIFIED(含 WR-04 硬编码警告) | 实测 OK;TOOL_ROUTES 硬编码为漂移隐患 |
| layouts / pages / ToolCard / App.vue | 框架壳 | ✓ VERIFIED | 双布局 + 空态 + 卡片 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| routes.ts | tools/index.ts | tools.map 派生 | ✓ WIRED | L5 import + L16 map |
| App.vue | layouts/ | route.meta.layout | ✓ WIRED | computed + component :is |
| home.vue | tools/index.ts | toolsByCategory() | ✓ WIRED | L44 import + L47 调用 |
| timestamp service | dayjs 插件链 | extend(utc) 先于 extend(timezone) | ✓ WIRED | L11-12 顺序正确 |
| timestamp/index.ts | tools/index.ts | defineTool 自注册 + 一行汇入 | ✓ WIRED | tools 数组 L19 |
| timestamp.vue | useCopy | 复制反馈 | ✓ WIRED | L186 + copyValue |
| json-formatter.vue | service | computed 单源解析 | ✓ WIRED | parsed computed L148-156 喂双视图 |
| CodeMirrorJson.vue | codemirror 包 | 仅工具目录静态 import | ✓ WIRED | 共享层零引用(grep 实证) |
| check-chunks.mjs | dist/ | 产物断言 | ✓ WIRED | 实测 exit 0 |
| safe-html.vue | sanitize.ts | computed sanitizedHtml | ✓ WIRED | 命名耦合即白名单机制 |
| eslint.config.ts | safe-html.vue | ignorePattern '^sanitized' | ✓ WIRED | L56 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| home.vue 分类网格 | categories | toolsByCategory()(注册表) | ✓ 两真实工具 | ✓ FLOWING |
| ToolCard | tool prop | 注册表元素 | ✓ 完整元数据 | ✓ FLOWING |
| json-formatter 双视图 | parsed | validateJson→formatJson/minifyJson/buildTree | ✓ 同一次解析 | ✓ FLOWING |
| timestamp 结果卡 | forwardResult/reverseResult | fromTimestamp/toTimestamp | ✓(有效输入) | ✓ FLOWING |
| dist 预渲染产物 | 全部 | SSG 构建期真实渲染 | ✓ 内容命中 | ✓ FLOWING |

无静态回退、无 hollow props、无 mock 数据流。

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| 全套测试回归 | `CI=true corepack pnpm vitest run` | 8 files / 78 tests passed | ✓ PASS |
| 类型检查 | `corepack pnpm type-check` | exit 0 | ✓ PASS |
| Lint 卡口 | `corepack pnpm lint` | oxlint 0 + eslint 0 | ✓ PASS |
| SSG 构建 | `corepack pnpm build` | exit 0,3 页预渲染 | ✓ PASS |
| 分包卡口 | `node scripts/check-chunks.mjs` | `OK: chunk budget pass` | ✓ PASS |
| CR-01 复现 | node 探针:dayjs.tz 非法时区 | RangeError ×3(Foo/Bar、UTC+8 正反) | ✗ FAIL(缺陷实证) |
| WR-01 复现 | node 探针:detectUnit(' 1735689600 ') | 返回 'ms'(期望 's') | ✗ FAIL(缺陷实证) |
| WR-02 复现 | `tsc -p tsconfig.vitest.json --listFilesOnly` | 覆盖测试文件数 = 0 | ✗ FAIL(测试游离于类型检查) |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| scripts/*/tests/probe-*.sh | find 无匹配 | 无约定 probe 脚本;以 build+check-chunks+vitest 全套作为等价可执行探针(全部 PASS) | ✓ 等价覆盖 |
| 6 specless probe rows 登记核查 | 检查 4 个 PLAN frontmatter | 01-01×2(ARCH-01/empty、ARCH-01/encoding)+ 01-02×1(TOOL-02 位数启发)+ 01-03×1(ARCH-04 jsdom 回退)+ 01-04×2(ARCH-02 轻量卡口、TOOL-01 语义边界)= 6/6 全部作为 flagged_assumptions 显式登记,无静默丢弃 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| ARCH-01 | 01-01 | 注册表契约,路由/导航/搜索/收藏校验/sitemap 全部派生 | ✓ SATISFIED(Phase 1 范围:路由/导航派生) | tool.ts 契约 + routes.ts 纯派生 + 15 用例;搜索/收藏/sitemap 消费方归 Phase 4/3,数据源契约已就位 |
| ARCH-02 | 01-01, 01-04 | 每工具独立路由懒加载,重依赖不进首屏 | ✓ SATISFIED | check-chunks 实测 OK;CM 隔离 grep;两工具独立 chunk |
| ARCH-04 | 01-03 | 统一 XSS 消毒渲染管线,唯一出口 | ✓ SATISFIED | sanitize.ts + SafeHtml + ESLint 卡口 + 12 用例 + vnode 优先(两工具零 HTML 字符串路径) |
| TOOL-01 | 01-04 | JSON 格式化/压缩/校验,长 ID 不丢精度 | ✓ SATISFIED | tokenizer 30 用例;2^53 原文保留 |
| TOOL-02 | 01-02 | 时间戳双向转换(含时区显示与日期计算) | ⚠️ PARTIAL | 有效输入路径 SATISFIED(13 用例 + 预渲染);但「非法输入结构化报错」面 FAILED(CR-01 白屏)——REQUIREMENTS.md 将其标为 [x] Complete 过早 |

REQUIREMENTS.md Traceability 表将 ARCH-01/02/04、TOOL-01/02 全部标为 Phase 1 Complete——本次验证确认前四项成立,TOOL-02 应视为 PARTIAL(见 Gaps)。无 orphaned requirement(Phase 1 映射的 5 个 ID 全部被 plan frontmatter 声明)。

### Prohibitions(4 个 PLAN 均存在,ADR-550 judgment-tier,自主验证记录 LLM-judge 判定)

| Plan | Category | 判定 | Evidence |
| ---- | -------- | ---- | -------- |
| 01-01 privacy(零网络/零上传/零遥测) | privacy | ✓ VERIFIED(judge) | grep src/ 零 fetch/XHR/axios/sendBeacon/analytics;@tailwindcss/vite 本地编译 |
| 01-02 transparency(识别回显 + 非法输入结构化错误) | transparency | ✗ **FAILED** | CR-01:非法时区输入抛异常白屏而非结构化错误(node 实证);识别回显本身已落地(结果卡首行) |
| 01-03 security(v-html 唯一出口) | security | ✓ VERIFIED(judge) | v-html 全站仅 safe-html.vue;innerHTML/insertAdjacentHTML 零命中;ESLint 卡口在源码且 fail-first 有记录 |
| 01-04 transparency(不静默修正/不重排键序/不改数字文本) | transparency | ✓ VERIFIED(judge) | tokenizer 源码零数值转换;重复键保序;尾逗号显式报错;30 用例回归 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| timestamp-converter.service.ts | 87, 93 | 未校验外部输入即调用抛异常 API(dayjs.tz)——自违反 V7 契约 | 🛑 Blocker | 手填时区白屏(见 Gaps) |
| timestamp-converter.service.ts | 51-52 | trim 不一致 → 位数错判 | ⚠️ Warning | UI 当前掩盖;Phase 5/8 复用地雷(见 Gaps) |
| tsconfig.vitest.json | 6 | `__tests__` 路径约定与实际 `*.test.ts` 布局错位 → 8 个测试文件零类型覆盖(tsc --listFilesOnly 实证 0 个) | ⚠️ Warning | ~780 行测试代码类型腐化不可见 |
| eslint.config.ts | 44 | vitest 插件规则 files 同源错位 → 测试可靠性 lint 空转 | ⚠️ Warning | 与上条同根因,一并修复 |
| scripts/check-chunks.mjs | 28 | TOOL_ROUTES 硬编码,违背注册表单一事实来源不变量(构建脚本侧) | ⚠️ Warning | 新增工具忘同步 → 预渲染页断言静默漏检 |
| README.md | 1 | 仍是 scaffold-tmp 模板内容 | ℹ️ Info | 接入文档缺失 |
| registry.test.ts | 48 | 注释「当前注册表(空)」已过时 | ℹ️ Info | 无功能影响 |
| check-chunks.mjs | 77 | import 提取正则不匹配 `../` 相对引用 | ℹ️ Info | 当前产物形态下断言成立;未来形态静默失效方向 |

无 TBD/FIXME/XXX 债务标记(扫描命中均为误报:\uXXXX 转义文档、HTML placeholder 属性)。

### SKELETON.md 一致性与人工闸门核查

- SKELETON.md 与 4 个 PLAN/SUMMARY 的架构决策、产物清单一致。一处预期内漂移:SKELETON(Stack 表)写 TS 5.9.3,实际采 create-vue 基线 TS 6.0.3——01-01 SUMMARY Deviation 2 已记录理由(非 RESEARCH 排除的 Go 编译器版),属规划期预期值 vs 执行期采信,不算失实。
- @lucide/vue 供应链闸门:01-02 SUMMARY 含完整人工确认记录(发布者/仓库 URL/README 导入示例原文/时间),lucide-vue-next 未混入(package.json 核查确认),blocking-human 闸门闭合属实。
- 14 个 SUMMARY 声明的提交哈希在 git log 中全部实存(逐一验证)。

## Human Verification Required

见 frontmatter `human_verification` 清单(5 项):时间戳工具 6 步走查(harvest 自 01-02 human-check)、**CR-01 修复后的白屏回归走查(新增)**、JSON 工具交互走查(01-04 D3)、双布局观感(01-01 D4)、SafeHtml 真实浏览器注入走查(01-03 D6,deferred 至 Phase 5/8)。

## Gaps Summary

阶段 1 的骨架、注册表契约、派生路由、分包卡口、XSS 消毒管线、JSON 工具全部达标且质量高于预期(fail-first 证明、BFS 可达性分析、测试盲区外的结构性防护)。**唯一但实质的缺口在时间戳工具的非法输入处理**:service 层承诺 V7「非法输入返回结构化错误、不裸抛」,13 个测试也验证了时间戳/日期文本的非法分支,但 UI 显式引导用户手填的时区自由文本(placeholder 即写着"手动输入 IANA 时区名")绕过了全部防护——输入 `UTC+8` 即抛 RangeError 导致整页白屏,实证复现且被测试盲区掩盖。这直接违反 01-02 must_haves truth #4、transparency 禁令与阶段目标「用户可立即使用首批 2 个工具完成真实操作」。

**修复路径明确且小**(01-REVIEW.md CR-01 已给代码):service 层 Intl 校验 tz → 返回 ok:false 结构化错误(错误卡 UI 已就绪),补 2 条非法时区测试;建议连带修复 WR-01(detectUnit trim,同为测试盲区内的 service 缺陷)。修复后需人工走查手填 UTC+8 场景确认错误卡而非白屏。

**Why not passed:** 1 条 must-have truth FAILED + 1 条 prohibition FAILED(同一根因)→ gaps_found。不构成 override 条件(无替代实现,是明确 bug)。

---

_Verified: 2026-09-07T03:40:11Z_
_Verifier: Claude (gsd-verifier)_
