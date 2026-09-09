<!-- 首页:消费注册表派生 helper 渲染分类卡片网格(禁止手写静态工具清单)
     D-15 存量迁移:整页空态卡换用六件套 Card;Typography 归一 h1 Display 28px/600、h2/空态标题 Heading 20px/600(UI-SPEC) -->
<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    <h1 class="font-mono text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
      little-utils
    </h1>
    <p class="mt-2 text-[var(--color-text-muted)]">
      开发者 &amp; 办公工具箱 — 所有计算均在浏览器本地完成,数据不出浏览器。
    </p>

    <!-- 空注册表整页空态(ARCH-01/empty 假设的 UI 侧体现:空态而非白屏;文案 UI-SPEC Empty state 锁定不改写)
         Card padding=false + 显式 p-10(Card 默认 p-5 不符空态大留白) -->
    <Card v-if="!hasAnyTool" :padding="false" class="mt-12 p-10 text-center">
      <p class="text-[20px] font-semibold text-[var(--color-text-primary)]">工具正在准备上线</p>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">
        工具注册表尚未收录任何工具,敬请期待。
      </p>
    </Card>

    <!-- 分类小节 + 工具卡片网格(grid 基线:sm 单列 lg 三列;响应式精细化归 Phase 2) -->
    <section v-for="category in categories" :key="category.id" class="mt-10">
      <h2 class="text-[20px] font-semibold text-[var(--color-text-primary)]">
        {{ category.name }}
      </h2>

      <!-- 分类空态保留虚线样式与原文案:虚线不属于 Card 实线卡片语言(UI-SPEC Component Inventory),
           不强行套 Card;文案「该分类工具即将上线」UI-SPEC Empty state 锁定不改写 -->
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
import { useHead } from '@unhead/vue'
import { toolsByCategory } from '../tools'
import ToolCard from '../components/ToolCard.vue'
// D-18:按需显式 import,无 barrel(D-15 home 空态卡消费 Card)
import Card from '../ui/Card.vue'

// D-06:首页 title 保留全角破折号（与 index.html:29 静态兜底同值）;
// titleTemplate: null discharge App 级「 - little-utils」半角模板,防止渲染成「…工具箱 - little-utils」双后缀。
// D-10:description 为 Claude 起草文案,验收时人工确认。
useHead({
  title: 'little-utils — 开发者 & 办公工具箱',
  titleTemplate: null,
  meta: [
    {
      name: 'description',
      content:
        '面向开发者与办公场景的免费在线工具箱，JSON 格式化、时间戳转换等常用工具即开即用，全部在浏览器本地完成，数据不上传、无需登录。',
    },
  ],
})

const categories = computed(() => toolsByCategory())
const hasAnyTool = computed(() => categories.value.some((c) => c.tools.length > 0))
</script>
