<!-- route.meta.layout 驱动双布局切换;布局组件不感知具体工具（D-03 接缝） -->
<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import HomeLayout from './layouts/home.layout.vue'
import ToolLayout from './layouts/tool.layout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'tool' ? ToolLayout : HomeLayout))

// D-06：title 模板「工具名 - little-utils」（半角连字符）；t 为空回落站点名。
// 仅影响 <title>；ogTitle 不经此模板（RESEARCH Pitfall 5，og 三件套在 useToolSeo 显式赋值）。
// 首页在 home.vue 以 titleTemplate: null discharge 本模板（保留 D-06 全角破折号现值）。
useHead({ titleTemplate: (t) => (t ? `${t} - little-utils` : 'little-utils') })
</script>
