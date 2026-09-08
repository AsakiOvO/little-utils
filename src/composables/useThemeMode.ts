// src/composables/useThemeMode.ts — 三态主题状态机(SITE-04;D-01/D-02/D-04/D-11)
// 为什么不用现成方案(语义不满足,非遗漏):
//   - useDark:布尔两态,无 auto 语义位,违背 D-02 三态契约;
//   - useColorMode:auto 分支经 usePreferredDark 解析,no-preference 系统回落「亮色」,违反 D-01 回落「暗色」。
// 系统偏好监听禁止裸调 matchMedia:usePreferredColorScheme 由 VueUse 管理监听/cleanup/SSR 守卫。
// 判定镜像:index.html head 内联 FOUC 阻塞脚本的 resolved 判定与本文件逐字镜像对齐,改此必改彼
//   (useThemeMode.test.ts 文本断言守护漂移,Pitfall 1)。
// 瞬切副作用(D-11/Pitfall 3):.theme-switching 类与 src/styles/base.css 中和规则配对
//   (两处注释互指,机制改动需同步,plan 02-01);双 requestAnimationFrame 后移除,
//   主题切换全程无全局过渡动画(组件级 hover 渐变不受限)。
import { computed, effectScope, watch } from 'vue'
import { usePreferredColorScheme, useStorage } from '@vueuse/core'
import type { Ref } from 'vue'

export type ThemePreference = 'dark' | 'light' | 'auto'
export type ResolvedTheme = 'dark' | 'light'

/**
 * 全站唯一 storage key 定义点(PITFALLS 键前缀惯例 `little-utils:v1:*` 首落地;
 * index.html 内联脚本字面引用此处值,勿单独改动)。
 */
export const THEME_STORAGE_KEY = 'little-utils:v1:theme'

/** 存储值白名单归一:非 'dark'/'light' 一律 'auto'(Pitfall 7 脏值防线;威胁 T-02-03 mitigate) */
function normalize(raw: unknown): ThemePreference {
  return raw === 'dark' || raw === 'light' ? raw : 'auto'
}

let singleton: ReturnType<typeof createThemeMode> | null = null

function createThemeMode() {
  // detached scope(应用级生命周期):状态机为模块级单例,其响应式副作用(watch/useStorage/
  // usePreferredColorScheme 的内部监听)不得绑定任何组件 scope——否则 watch 随首个调用方
  // (如首页 layout 顶栏的 ThemeToggle)卸载而被 Vue 自动停止,导航切换 layout 后 DOM 副作用
  // 停摆。D-23 人工验收实证(2026-09-08):首页→工具页后主题切换失效——CodeMirror 输入区
  // 消费 resolved 响应式仍联动,而页面 .dark 类消费的 DOM 副作用已死;useThemeMode.test.ts
  // ⑦ 回归锁定。detached=true:不随父 scope/组件卸载 stop,单例语义下无泄漏(仅创建一次)。
  const api = effectScope(true).run(() => {
    const preference = useStorage<ThemePreference>(THEME_STORAGE_KEY, 'auto', undefined, {
      // vite-ssg mounted 纪律(Pitfall 6):预渲染期不读 storage,防水合不匹配
      initOnMounted: true,
      serializer: { read: normalize, write: (v: ThemePreference) => v },
    })
    const system = usePreferredColorScheme() // ComputedRef<'dark' | 'light' | 'no-preference'>,实时联动(D-04)

    const resolved = computed<ResolvedTheme>(() => {
      if (preference.value !== 'auto') return preference.value
      return system.value === 'light' ? 'light' : 'dark' // no-preference 显式回落暗(D-01)
    })

    // DOM 副作用:SSG Node 预渲染无 document,必须守卫(Pitfall 6)
    watch(resolved, (mode) => {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      root.classList.add('theme-switching') // D-11 瞬切窗口:配对 base.css 中和规则,双 rAF 后移除
      root.classList.toggle('dark', mode === 'dark')
      root.style.colorScheme = mode
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('theme-switching')
        })
      })
    })

    /** D-02/D-03 循环:暗 → 亮 → 跟随系统 → 暗 */
    function cycle(): void {
      preference.value = preference.value === 'dark' ? 'light' : preference.value === 'light' ? 'auto' : 'dark'
    }

    return { preference: preference as Ref<ThemePreference>, resolved, cycle }
  })

  // scope.run 同步执行成功必返回值(undefined 仅当 scope 已停止——detached 新 scope 不可达);
  // 显式守卫而非非空断言,满足 lint 纪律且让不变量可见。
  if (!api) throw new Error('useThemeMode: effectScope.run() 同步返回空(不可达)')
  return api
}

/** 模块级单例:ThemeToggle / CodeMirrorJson 等多消费点共享同一状态 */
export function useThemeMode() {
  singleton ??= createThemeMode()
  return singleton
}
