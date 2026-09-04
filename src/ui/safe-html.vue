<!-- src/ui/safe-html.vue —— 全站唯一允许 v-html 的组件（ARCH-04 唯一 HTML 字符串出口）
     绑定名 sanitizedHtml 以 sanitized 开头：这是 ESLint vue/no-v-html ignorePattern '^sanitized'
     白名单的触发条件，而 sanitized* 命名只能来自 sanitizeHtml() 返回值——出口被 lint + 命名双重收敛 -->
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="safe-html" v-html="sanitizedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '../utils/sanitize'

const props = defineProps<{ html: string }>()

const sanitizedHtml = computed(() => sanitizeHtml(props.html))
</script>
