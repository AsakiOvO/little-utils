<!-- route.meta.layout 驱动双布局切换;布局组件不感知具体工具（D-03 接缝） -->
<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeLayout from './layouts/home.layout.vue'
import ToolLayout from './layouts/tool.layout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'tool' ? ToolLayout : HomeLayout))
</script>
