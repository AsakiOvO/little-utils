<!-- home 布局:强风格基线（D-03 结构定型;Phase 4/6 只填充内容/样式,不重构结构） -->
<template>
  <div class="flex min-h-dvh flex-col bg-[var(--color-bg)]">
    <header class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="flex items-center gap-2">
          <!-- 品牌 logo:Display 28px/600 归一(UI-SPEC Typography);D-08 原语豁免经 02-REVIEW CR-01 重新裁定:
               logo 为真实文本内容(非装饰图形),亮色下原语青 1.37:1 < 大字 3:1 红线,改经 accent 消费
               (亮=深霓虹 7.59:1,暗=原语,霓虹品牌感保留);glow-cyan 阴影为装饰非文本,保留 D-08 用法 -->
          <span
            class="font-mono text-[28px] font-semibold tracking-tight text-[var(--color-accent)] shadow-[var(--shadow-glow-cyan)]"
          >
            little-utils
          </span>
        </RouterLink>
        <div class="flex items-center gap-4">
          <!-- 站点副标题非导航区块(无链接):用 span 避免 nav 空地标误播报(02-REVIEW WR-02) -->
          <span class="text-sm text-[var(--color-text-muted)]">开发者 &amp; 办公工具箱</span>
          <!-- ThemeToggle:三态主题切换控件(D-02/D-03),顶栏右上角;Phase 4/6 只填不改 -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <slot />

    <footer class="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div
        class="mx-auto w-full max-w-5xl px-4 py-4 text-center text-sm text-[var(--color-text-muted)]"
      >
        little-utils — 所有计算均在浏览器本地完成,数据不出浏览器
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// D-18:按需显式 import,无 barrel(D-03 ThemeToggle 挂载点)
import ThemeToggle from '../ui/ThemeToggle.vue'
</script>
