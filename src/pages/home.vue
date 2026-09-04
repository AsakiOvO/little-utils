<!-- 首页:消费注册表派生 helper 渲染分类卡片网格(禁止手写静态工具清单) -->
<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    <h1 class="font-mono text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
      little-utils
    </h1>
    <p class="mt-2 text-[var(--color-text-muted)]">
      开发者 &amp; 办公工具箱 — 所有计算均在浏览器本地完成,数据不出浏览器。
    </p>

    <!-- 空注册表整页空态(ARCH-01/empty 假设的 UI 侧体现:空态而非白屏) -->
    <div
      v-if="!hasAnyTool"
      class="mt-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center"
    >
      <p class="text-lg font-medium text-[var(--color-text-primary)]">工具正在准备上线</p>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">
        工具注册表尚未收录任何工具,敬请期待。
      </p>
    </div>

    <!-- 分类小节 + 工具卡片网格(grid 基线:sm 单列 lg 三列;响应式精细化归 Phase 2) -->
    <section v-for="category in categories" :key="category.id" class="mt-10">
      <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
        {{ category.name }}
      </h2>

      <div
        v-if="category.tools.length === 0"
        class="mt-4 rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]"
      >
        该分类工具即将上线
      </div>

      <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard v-for="tool in category.tools" :key="tool.path" :tool="tool" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toolsByCategory } from '../tools'
import ToolCard from '../components/ToolCard.vue'

const categories = computed(() => toolsByCategory())
const hasAnyTool = computed(() => categories.value.some((c) => c.tools.length > 0))
</script>
