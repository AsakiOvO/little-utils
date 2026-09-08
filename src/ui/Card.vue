<!-- src/ui/Card.vue —— 六件套卡片容器(动态标签 as + padding 可关)
     D-13 六件套 / D-15 存量迁移面:ToolCard / home 空态 / not-found / json-formatter 卡片换用本组件
     D-18 无前缀命名 + 按需显式导入(延续 safe-html 惯例)
     UI-SPEC Component Inventory Card 行:surface 底 + border 圆角容器,语义令牌消费,零 glow(D-08)
     用法(供 plan 02-06 迁移):as="RouterLink" + :to 供 ToolCard 卡片链接场景(attrs to 自然透传动态标签);
     padding=false 供 p-10(home 空态卡)/ p-3(json-formatter 结果卡)等定制内边距场景 -->
<template>
  <component
    :is="as"
    class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    :class="padding ? 'p-5' : ''"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
defineOptions({ name: 'Card', inheritAttrs: true })

withDefaults(
  defineProps<{
    /** 动态标签:'div'(默认)/ 'section' / 'RouterLink'(配 :to,attrs 透传)等 */
    as?: string
    /** 默认 p-5 内边距;false 关闭(供调用方定制 p-10/p-3 等) */
    padding?: boolean
  }>(),
  { as: 'div', padding: true },
)
</script>
