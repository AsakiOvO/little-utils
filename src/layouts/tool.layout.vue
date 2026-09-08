<!-- tool 布局:克制易读（D-03/Pitfall 4:禁止任何 glow/动画类侵入工具区） -->
<template>
  <div class="flex min-h-dvh flex-col bg-[var(--color-bg)]">
    <header class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div class="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 py-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
        >
          <span aria-hidden="true">←</span>
          <span>返回首页</span>
        </RouterLink>
        <!-- ThemeToggle:三态主题切换控件(D-02/D-03),ml-auto 推到顶栏右上角;返回首页链接不动(归一在 plan 02-06) -->
        <div class="ml-auto flex items-center gap-3">
          <span class="font-mono text-sm text-[var(--color-text-muted)]">little-utils</span>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- 主区:max-w 容器约束工具内容宽度,保证可读性 -->
    <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// D-18:按需显式 import,无 barrel(D-03 ThemeToggle 挂载点)
import ThemeToggle from '../ui/ThemeToggle.vue'
</script>
