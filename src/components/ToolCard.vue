<!-- 工具卡片:消费 Tool 元数据（icon/name/description/isNew 派生值,不在组件重算日期窗口）
     D-15 存量迁移:根容器由手写卡片样式(rounded-lg/border/bg-surface/p-5)换用六件套 Card
     as="RouterLink" + :to 经 attrs 透传渲染链接;hover accent 保留(UI-SPEC Accent reserved「工具卡 hover 边框」) -->
<template>
  <Card
    as="RouterLink"
    :to="tool.path"
    class="group flex flex-col gap-2 transition-colors hover:border-[var(--color-neon-cyan)] hover:bg-[var(--color-surface-raised)]"
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
  </Card>
</template>

<script setup lang="ts">
import type { Tool } from '../tools'
// D-18:按需显式 import,无 barrel
import Card from '../ui/Card.vue'

defineProps<{
  tool: Tool
}>()
</script>
