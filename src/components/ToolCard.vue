<!-- 工具卡片:消费 Tool 元数据（icon/name/description/isNew 派生值,不在组件重算日期窗口） -->
<template>
  <RouterLink
    :to="tool.path"
    class="group flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-neon-cyan)] hover:bg-[var(--color-surface-raised)]"
  >
    <div class="flex items-center justify-between">
      <span class="text-[var(--color-neon-cyan)]">
        <component :is="tool.icon" class="size-6" aria-hidden="true" />
      </span>
      <span
        v-if="tool.isNew"
        class="rounded-full border border-[var(--color-neon-magenta)] px-2 py-0.5 font-mono text-xs text-[var(--color-neon-magenta)]"
      >
        NEW
      </span>
    </div>

    <h3 class="text-base font-semibold text-[var(--color-text-primary)]">{{ tool.name }}</h3>
    <p class="text-sm text-[var(--color-text-muted)]">{{ tool.description }}</p>
  </RouterLink>
</template>

<script setup lang="ts">
import type { Tool } from '../tools'

defineProps<{
  tool: Tool
}>()
</script>
