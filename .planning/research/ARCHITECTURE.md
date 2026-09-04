# Architecture Research

**Domain:** 纯前端开发者/办公工具箱静态站(元数据驱动注册表 + 预渲染 SPA)
**Researched:** 2026-09-04
**Confidence:** HIGH(核心模式有 it-tools 源码级验证 + Vue Router/Vite/MDN/VueUse 官方文档;性能与 Astro 对比为 MEDIUM)

## Standard Architecture

### System Overview

该领域的事实标准架构(it-tools、omni-tools、he3 等同类项目均采用变体)是**清单驱动的注册表架构**:每个工具是一个自包含模块,元数据(name/path/keywords/懒加载组件)注册进中央注册表,路由、导航、搜索、SEO 全部由注册表派生。新增工具 = 加一个目录 + 在注册表加一行,其余系统零改动。

```
┌────────────────────────────────────────────────────────────────────┐
│                       表现层(Shell / 布局)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ 首页/导航     │  │ 工具布局      │  │ 静态页(About/404)       │  │
│  │ (强风格化)    │  │ (克制易读)    │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
├─────────┴──────────────────┴────────────────────────────────────────┤
│                       注册表层(单一事实来源)                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ tools/index.ts: toolsByCategory / tools / toolsWithCategory  │  │
│  │ 派生 → 路由表 │ 搜索索引 │ 分类菜单 │ 收藏列表 │ sitemap       │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                       工具模块层(每工具一个目录)                      │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐   │
│   │ json-   │  │ time-   │  │ qr-     │  │ md-     │  │ ...   │   │
│   │ format  │  │ stamp   │  │ code    │  │ editor  │  │       │   │
│   │ .vue+ts │  │ .vue+ts │  │ .vue+ts │  │ .vue+ts │  │       │   │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └───┬───┘   │
│        │  仅依赖共享层,工具之间零依赖(↔ 禁止)                      │
├────────┴────────────┴────────────┴────────────┴───────────┴─────────┤
│                       共享层(composables + ui + utils)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │ useCopy  │ │ useDownload│ │ useTheme │ │ useFavorites/useSettings│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘   │
│  ┌──────────┐ ┌──────────────────┐ ┌───────────────────────────┐   │
│  │ c-* 基础  │ │ 纯函数 utils      │ │ 主题 tokens(CSS 变量层)  │   │
│  │ 组件库    │ │ (编码/校验/转换)  │ │ (primitive→semantic→效果) │   │
│  └──────────┘ └──────────────────┘ └───────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                       持久化层(localStorage,无后端)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ lu:favorites │  │ lu:settings  │  │ 工具自有状态(可选)     │    │
│  └──────────────┘  └──────────────┘  └────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                       构建期层(静态产物)                             │
│  vite-ssg: 每条路由 → 预渲染 HTML(meta 来自 useHead)               │
│  Vite/Rolldown: 每个工具 → 独立异步 chunk(JS+CSS)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **工具注册表** `tools/index.ts` | 全站单一事实来源:分类分组 + 工具元数据 + 懒加载组件引用;供路由/搜索/菜单/收藏/sitemap 消费 | 集中数组,`defineTool()` 包装函数注入派生字段(如 isNew);参考 it-tools `src/tools/index.ts` |
| **工具模块** `tools/<slug>/` | 一个工具的全部实现:定义、组件、纯逻辑、测试;与其它工具零依赖 | 目录内 `index.ts`(定义)+ `<slug>.vue`(视图)+ `<slug>.service.ts`(纯函数)+ 测试 |
| **路由生成器** | 从注册表派生路由:tool.path → route path,懒组件 → route component;404 兜底 | `tools.map(t => ({ path: t.path, component: t.component, meta: {...t} }))`,通配符 404 置尾 |
| **Shell/布局** | 首页与导航强风格化;工具布局克制易读;切换布局 = 换 layout 组件 | 两个 layout(base/tool),路由 meta.layout 选择;it-tools 同款模式 |
| **搜索/分类导航** | 关键词过滤注册表(name+description+keywords);分类折叠菜单 | `computed` 派生,无需索引库;工具 ≤100 时 O(n) 过滤足够 |
| **收藏/设置 store** | localStorage 读写 + 跨标签页同步;应用启动时水合 | Pinia store 或 `useStorage()`(VueUse):`initOnMounted` 防 SSR 水合不匹配 |
| **共享 composables** | useCopy(剪贴板两层降级)、useDownload(带文件名下载)、useTheme(暗色) | 框架组合式函数;纯浏览器 API 封装 |
| **基础组件库 `ui/c-*`** | 按钮/输入框/卡片/可复制文本域——保证全站一致性,工具区"克制易读"靠这里兜底 | 独立目录 + 自动导入(unplugin-vue-components) |
| **主题 tokens** | CSS 变量三层:primitive(色板)→ semantic(bg/text/border)→ effect(glow/glitch) | `:root` + `data-theme` 属性覆盖;效果类只在装饰层 scope |
| **构建期预渲染** | 每条工具路由生成含完整 meta 的静态 HTML;运行时水合回 SPA | vite-ssg(内置 @unhead/vue,useHead 写 meta;includedRoutes 过滤) |

## Recommended Project Structure

```
src/
├── tools/                    # ★ 工具注册表 + 各工具模块(每工具自包含目录)
│   ├── index.ts              # toolsByCategory 注册表:分类 → defineTool 列表
│   ├── tool.ts               # defineTool() 包装器(注入派生字段)
│   ├── tools.types.ts        # Tool 接口: name/path/description/keywords/component()/icon/category
│   ├── json-formatter/
│   │   ├── index.ts          # defineTool({ name, path, keywords, component: () => import('./json-formatter.vue') })
│   │   ├── json-formatter.vue          # 视图组件(懒加载 chunk 入口)
│   │   ├── json-formatter.service.ts   # 纯函数逻辑(可独立单测,零框架依赖)
│   │   └── json-formatter.service.test.ts
│   └── ...
├── layouts/                  # base.layout(首页/导航,强风格) + tool.layout(工具区,克制)
├── components/               # 通用业务组件(ToolCard、搜索框、收藏菜单)
├── ui/                       # 基础组件库 c-button / c-input / c-textarea-copyable 等
├── composables/              # useCopy / useDownload / useTheme / useFavorites / useSettings
├── utils/                    # 纯函数:编码/转换/校验,withDefaultOnError 等
├── stores/                   # Pinia(或 composables):favorites、settings、style
├── styles/
│   ├── tokens.css            # primitive + semantic CSS 变量(:root / [data-theme])
│   ├── effects.css           # 霓虹/故障/扫描线效果类(仅装饰层使用)
│   └── base.css              # reset + 全局样式 + prefers-reduced-motion 降级
├── router.ts                 # 从注册表生成路由 + 布局选择 + 404 兜底
├── pages/                    # Home(强风格化,不懒加载)、About、404
├── main.ts                   # ViteSSG 包装入口;插件链:pinia → router → ui
└── vite.config.ts            # vite-ssg 配置(ssgOptions.includedRoutes)+ 构建分包
scripts/
└── create-tool.mjs           # 脚手架:生成工具目录骨架并插入注册表(增量添加的关键)
```

### Structure Rationale

- **tools/ 为核心**:每个工具自包含目录是"隔离 + 增量添加"的基石——删一个目录即删工具;工具内部再分 `.vue`(视图)与 `.service.ts`(纯函数),使核心转换逻辑可脱离框架做单元测试,也便于未来迁移框架。
- **layouts/ 分离**:项目约束"首页强风格、工具区克制"映射为两个布局组件,由路由 meta 切换;工具开发者不接触全局风格代码。
- **ui/ 独立于 components/**:基础组件(无业务语义)与业务组件(ToolCard 等)分开,防止工具区被赛博朋克装饰污染——克制易读性由 `ui/c-*` 的中性样式保证。
- **styles/tokens.css 独立**:设计 tokens 是全站唯一颜色/字号来源,主题切换和工具区"降噪"都通过变量作用域实现,不靠散落的硬编码样式。
- **scripts/create-tool.mjs**:it-tools 的关键实践——脚手架自动生成目录 + 插入注册表 import,把"新增一个工具"的机械操作降到最低,保证 50+ 工具时注册表不腐化。

## Architectural Patterns

### Pattern 1: 元数据驱动的工具注册表(Registry Pattern)

**What:** 每个工具导出一个声明式定义对象(名称、路径、描述、关键词、懒加载组件引用),集中汇入注册表数组;路由、导航菜单、搜索索引、收藏列表、sitemap 全部从该数组派生。
**When to use:** 任何"同类功能单元 × N 个"的站点(工具箱、组件 playground、示例集)。
**Trade-offs:** 中心注册表可能成为合并冲突热点 → 用"每目录 index.ts + 按分类分组"与脚手架脚本缓解;元数据在构建期与组件绑定,无法运行时热插拔(对本项目无影响)。

```typescript
// src/tools/tools.types.ts —— it-tools 验证过的形状(源码级确认)
export interface Tool {
  name: string;                       // 显示名
  path: string;                       // URL 路径,如 /json-formatter
  description: string;                // SEO description + 搜索文本
  keywords: string[];                 // 搜索关键词
  component: () => Promise<Component>;// 懒加载:() => import('./json-formatter.vue')
  icon: Component;                    // 同步引用(轻量)
  isNew: boolean;                     // 由 defineTool 从 createdAt 派生
  createdAt?: Date;
}

// src/tools/json-formatter/index.ts —— 工具自注册
export default defineTool({
  name: 'JSON 格式化',
  path: '/json-formatter',
  description: 'JSON 校验、格式化与压缩,浏览器本地完成',
  keywords: ['json', 'format', '校验', '美化'],
  component: () => import('./json-formatter.vue'),  // 懒加载 = 独立 chunk
  icon: IconJson,
  createdAt: new Date('2026-09-04'),
});

// src/router.ts —— 路由 = 注册表的纯派生
const toolRoutes = tools.map(tool => ({
  path: tool.path,
  component: tool.component,          // 懒加载组件直接作为路由组件
  meta: { ...tool, layout: 'tool' },  // 布局选择 + SEO 元数据进 meta
}));
// 追加静态页与 404(通配符必须最后)
```

### Pattern 2: 视图/逻辑分离的懒加载工具模块(View-Service Split)

**What:** 每个工具目录内,转换/计算逻辑写成纯 TypeScript(`.service.ts`),Vue 组件只做输入输出绑定;组件经 `() => import()` 引用,使每个工具成为独立 chunk,按需下载。
**When to use:** 所有工具;逻辑复杂的工具必须分离,简单工具可内联到组件。
**Trade-offs:** 多一层文件;换来的是:service 可零依赖单测、chunk 边界清晰、逻辑可被其他工具复用而不拖入其 UI。

```typescript
// json-formatter.service.ts —— 纯函数,无 Vue 依赖,可独立测试
export function formatJson(input: string, indent = 2): { ok: boolean; result: string; error?: string } {
  try { return { ok: true, result: JSON.stringify(JSON.parse(input), null, indent) }; }
  catch (e) { return { ok: false, result: '', error: (e as Error).message }; }
}

// json-formatter.vue —— 视图绑定 + 共享 composables
const input = ref(''); const output = computed(() => formatJson(input.value));
const { copy } = useCopy();
```

### Pattern 3: 构建期预渲染 + 客户端水合(Prerender + Hydration)

**What:** 用 vite-ssg 在构建期把每条工具路由渲染成完整静态 HTML(meta 已注入),部署后仍是静态文件;浏览器加载后水合回完整 SPA。SEO 与"每工具独立可分享 URL"同时满足,且无需任何服务器。
**When to use:** 路由集合构建期已知、内容不依赖服务端数据的项目——纯前端工具箱是完美适配。
**Trade-offs:** 双重负载(HTML 里已含内容,但仍需下载 JS 水合);写代码需遵守两个纪律:(a) 依赖浏览器 API 的初始化放进 `onMounted`/`initOnMounted`(预渲染运行在 Node,无 localStorage/clipboard);(b) localStorage 状态渲染的区域延迟到挂载后,否则水合结果与静态 HTML 不一致。

```typescript
// main.ts —— vite-ssg 入口
export const createApp = ViteSSG(App, { routes }, ({ app, router }) => {
  app.use(createPinia());
});

// 工具页组件内 —— meta 同时进预渲染 HTML 和客户端 SPA
useHead({
  title: 'JSON 格式化 - little-utils',
  meta: [{ name: 'description', content: '浏览器本地完成 JSON 校验与美化' }],
});

// 收藏状态 —— initOnMounted 防水合不匹配(Node 预渲染期无 localStorage)
const favorites = useStorage<string[]>('lu:favorites', [], undefined, { initOnMounted: true });
```

## Data Flow

### 启动流(应用外壳)

```
[浏览器请求 /json-formatter]
    ↓ 静态托管直接返回预渲染 HTML(含 meta,爬虫可直接索引)
[HTML 加载] → [CSS(tokens)阻塞渲染] → [首屏立即可见:标题+描述]
    ↓
[JS bundle: 框架+shell+注册表(小,单文件)] → [水合] → [路由匹配]
    ↓
[懒加载该工具 chunk] → [工具组件挂载] → [工具可交互]
```

### 工具操作流(计算在本地)

```
[用户输入] → [v-model] → [computed → service 纯函数]
    ↓
[输出展示] → [useCopy()/useDownload()] → [Clipboard API(降级 execCommand)/ Blob+a[download]]
```

### 持久化流(收藏/设置)

```
[点击收藏] → [favorites store/useStorage] → [内存 ref 立即更新 UI]
    ↓ (watch, deep)
[JSON 序列化] → [localStorage 'lu:favorites']
    ↓ (storage 事件)
[其他标签页自动同步]
    ↓ (应用下次启动, mounted 后读取)
[首页收藏区置顶渲染]
```

### 关键数据流说明

1. **注册表 → 五个消费者**:路由表、分类菜单、搜索过滤、收藏校验(防止收藏失效工具)、sitemap 生成,全部消费同一个 `toolsWithCategory`。这是"加工具零改动"的原因——新增工具后这些系统自动获得它。
2. **meta 的单向流**:工具定义(注册表)→ 路由 meta / useHead → 预渲染 HTML。不存在反向流;SEO 内容只有一处源头。
3. **设置 → 主题的单向流**:`settings store` → `data-theme` 属性 → CSS 变量级联 → 全站样式。组件不直接判断暗色,只消费变量。

## Scaling Considerations

本项目的"规模"主轴不是用户量(纯静态托管几乎不会遇到),而是**工具数量**与**首页资产体积**:

| Scale | 架构调整 |
|-------|----------|
| 0–20 个工具 | 无需任何优化;注册表单文件、路由全预渲染、图标打一个包 |
| 20–60 个工具 | 关注首页资产:图标改为注册表内按需的同步小组件或统一雪碧图;搜索仍用 computed 过滤;预渲染产物仍很小(HTML 不含 JS) |
| 60–150+ 工具 | 预渲染构建时间增长但可接受(工具页 HTML 极轻);考虑重分类 + 常用工具"最近使用"列表;注册表可按分类拆文件再聚合;此时才考虑给搜索加 web worker 或迷你索引 |

### Scaling Priorities

1. **第一个瓶颈:首屏 JS 体积**(不是用户量)。对策:首页强风格化的装饰动画用纯 CSS;shell 只含框架 + 注册表 + 导航,工具代码 100% 在懒加载 chunk 里;`manualChunks`/Rolldown `codeSplitting.groups` 把 vendor 与 shell 分开,让框架缓存友好。
2. **第二个瓶颈:注册表文件冲突与遗忘**(协作/迭代层面)。对策:脚手架脚本 + 每工具目录自包含 + lint 规则禁止工具间跨目录 import。

## Anti-Patterns

### Anti-Pattern 1: 手写静态路由表

**What people do:** 在 `router.ts` 里逐条手写 50 个工具的路由,注册表另维护一份元数据。
**Why it's wrong:** 两处真相必然漂移——加了工具忘加路由(或反之),meta 重复维护,SEO 数据与导航数据不一致。
**Do this instead:** 路由 = 注册表的 `map` 派生;工具定义是唯一写入点。

### Anti-Pattern 2: 工具代码全局注册 / 一次性全量打包

**What people do:** 在 `main.ts` 里静态 import 所有工具组件,或把所有工具塞进一个组件目录共享文件。
**Why it's wrong:** 首包随工具数线性膨胀,用户为从未使用的工具下载代码;无法增量删除。
**Do this instead:** 工具组件一律 `() => import()` 懒加载;唯一允许静态 import 的是首页(it-tools 同款:LCP 关键页不懒加载)。

### Anti-Pattern 3: 工具间互相 import / 工具依赖业务组件

**What people do:** 工具 A 直接 import 工具 B 的 service 或组件(图省事)。
**Why it's wrong:** chunk 图被拉扯,B 的代码被打进 A 的 chunk;删除 B 时 A 编译失败;"增量添加"被破坏。
**Do this instead:** 共享代码只能下沉到 `composables/`、`utils/`、`ui/`;工具间依赖视为编译错误(lint 强制)。

### Anti-Pattern 4: 动画阴影直接动 box-shadow/text-shadow

**What people do:** 对霓虹发光元素直接动画 `box-shadow` 或 `text-shadow` 制造"呼吸灯"效果。
**Why it's wrong:** 阴影在 paint 阶段,CPU 每帧重绘,多元素并发时明显掉帧(多个中文技术社区实测一致);工具区输入框卡顿直接毁掉"克制易读"。
**Do this instead:** 发光 = 伪元素上的静态阴影,动画只碰 `opacity`/`transform`(合成器加速);扫描线用 `background-image` + transform;`@property` 注册的变量需要插值动画时才用。所有装饰动画必须在 `prefers-reduced-motion: reduce` 下禁用或收敛(MDN 无障碍要求:运动可诱发前庭障碍/癫痫)。

### Anti-Pattern 5: 挂载前读 localStorage / 无防护地解析存储

**What people do:** 在模块顶层(而非 mounted)读 localStorage 决定渲染;或直接 `JSON.parse(localStorage.getItem(...))`。
**Why it's wrong:** 预渲染运行在 Node(无 localStorage)→ 构建报错或水合不匹配闪烁;隐私模式/配额满时 getItem 为 null 或 setItem 抛 QuotaExceededError,整站崩。
**Do this instead:** 用 `useStorage(initOnMounted: true)` 或 onMounted 读取;统一封装层 try/catch + `{version, data}` 信封做 schema 迁移;写失败静默降级(工具仍可用,只是不记住状态)。

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| 静态托管(EdgeOne/Vercel/GH Pages) | 构建产物目录直接部署;SPA fallback(vite-ssg 已为每路由生成 HTML,fallback 几乎用不到) | 国内访问与平台选择由 stack 研究决定;架构上唯一要求是"能托管目录静态文件" |
| sitemap.xml / robots.txt | 构建期从注册表生成(vite-ssg 生态插件或自写 30 行脚本) | 工具 URL 即注册表 path;新增工具自动进 sitemap |
| 剪贴板 | `navigator.clipboard.writeText` 优先,execCommand+textarea 降级 | **需要 HTTPS(secure context)**——部署平台必须 HTTPS,否则共享层自动降级;降级必须发生在用户手势处理器内 |
| 无 | 不引入任何后端 API/分析上传(隐私约束) | 分析如需(Plausible 类)由 stack/milestone 决定,架构上留 plugins/ 扩位点 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| 工具 ↔ 共享层 | 单向依赖:工具 import composables/ui/utils | 工具永不 import 其它工具(编译期强制) |
| 注册表 ↔ 路由/搜索/收藏 | 单向派生:注册表是唯一数据源 | 消费方对 Tool 元数据只读 |
| store ↔ localStorage | 封装层隔离(useStorage/持久化插件),组件不直接碰 window.localStorage | 水合时机(mounted)由封装层统一保证 |
| 布局 ↔ 工具 | 路由 meta.layout 选择布局;布局提供插槽/出口,不感知具体工具 | 工具区"克制"由 tool.layout + ui/c-* 保证 |
| tokens ↔ 组件 | 组件只消费 semantic 变量(--bg-surface 等),不直接引用 primitive 色值 | 主题切换=换 data-theme,组件零改动 |

## Build Order(组件构建顺序,供 roadmap 参考)

依赖关系决定顺序——后一项依赖前一项的接口存在:

1. **应用骨架**:Vite 工程 + 路由 + 两个 layout(空壳)+ tokens.css 雏形 → 跑通"页面存在"。
2. **注册表机制 + 第一个工具**(JSON 格式化是理想首工具:纯逻辑、无重型依赖):types + defineTool + 路由派生 + 脚手架脚本。此阶段固化 `Tool` 接口——它是全站契约,越早定型越好。
3. **共享层核心**:useCopy/useDownload/ui 基础组件(c-input/c-button/c-textarea-copyable)——从第一个工具的诉求中提炼,而不是凭空设计。
4. **预渲染 + SEO**:接入 vite-ssg + useHead 每工具 meta + sitemap 生成。放在工具批量生产**之前**,避免之后批量改 meta。
5. **收藏/设置持久化**:favorites/settings store + 首页收藏区(initOnMounted 纪律)。
6. **搜索 + 分类导航**:消费注册表,纯前端过滤。
7. **赛博朋克视觉强化**:在可用骨架上叠加首页强风格(glow/glitch/HUD);工具区保持克制。
8. **工具批量生产**:此后每个工具都是模式复制,可并行推进。

> 关键洞察:2→3→4 的顺序不可颠倒。先定注册表契约再提炼共享层(共享 API 从真实工具需求中长出来),先有每工具 meta 再批量加工具(避免返工)。

## Sources

- it-tools 源码验证(GitHub raw):`src/tools/tool.ts`、`src/tools/tools.types.ts` — Tool 接口、defineTool、懒加载 component 字段(HIGH,一手源码)
- DeepWiki:CorentinTh/it-tools §2 Architecture / §2.3 Router / §4 Tools Implementation — 注册表→路由派生、布局选择、composables 目录(2026-02 索引,MEDIUM,与源码交叉验证一致)
- Vue Router 官方文档(Lazy Loading Routes)— 动态导入路由组件、chunk 缓存、manualChunks 分组(MEDIUM)
- Vite 官方文档(Features/Build)— cssCodeSplit、async chunk preload 优化、Rolldown 迁移与 manualChunks 弃用(MEDIUM)
- vite-ssg(antfu-collective)README — ViteSSG 入口、@unhead/vue 每页 meta、includedRoutes、beasties critical CSS、双重负载局限(MEDIUM,活跃维护中)
- MDN Web Docs — Navigator.clipboard 与 execCommand 降级策略、CSS 自定义属性与 @property、prefers-reduced-motion 无障碍要求(MEDIUM)
- VueUse 官方文档 — useStorage 全选项(deep/listenToStorageChanges/initOnMounted/onError/自定义序列化)(MEDIUM)
- 社区性能共识(多篇中文技术博客交叉一致)— box-shadow/text-shadow 动画导致 CPU 重绘掉帧、伪元素 opacity/transform 替代方案(LOW→MEDIUM,多来源一致)
- Astro 生态综述(2026 年文章)— Islands 按需水合、Content Collections、岛屿间通信需事件/store、MPA 式导航特性(MEDIUM)

---
*Architecture research for: 开发者/办公工具箱纯前端静态站(注册表驱动 + 预渲染 SPA)*
*Researched: 2026-09-04*
