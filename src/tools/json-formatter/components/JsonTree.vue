<!-- JSON 树形视图（D-02，RESEARCH §Pattern 4）：自研递归可折叠组件，不引入树视图库 -->
<!-- 渲染纪律（ARCH-04/T-01-01）：全部节点经 Vue 文本插值/属性绑定渲染（vnode 路径），
     不构造任何 HTML 字符串 —— 含 <script>/事件属性的字符串值只会显示为纯文本。 -->
<!-- 数据源 = tokenizer 产出（数字是 raw 原文字符串），长 ID 显示零精度丢失。 -->
<template>
  <!-- 对象/数组容器节点：头部可点击折叠 -->
  <div v-if="node.type === 'object' || node.type === 'array'" class="min-w-0">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded px-0.5 py-px text-left transition-colors hover:bg-[var(--color-surface-raised)]"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="w-3 shrink-0 select-none text-center font-mono text-[var(--color-text-muted)]">
        {{ open ? '▾' : '▸' }}
      </span>
      <span class="font-mono text-[var(--color-text-muted)]">{{ node.type === 'object' ? '{ }' : '[ ]' }}</span>
      <!-- 计数徽标：数组用 Array(n) 形式，对象用「n 项」（电商长数组默认收起可读） -->
      <span class="rounded border border-[var(--color-border)] px-1 font-mono text-xs text-[var(--color-text-muted)]">
        {{ node.type === 'object' ? `${node.properties.length} 项` : `Array(${node.items.length})` }}
      </span>
    </button>

    <!-- 折叠体：展开才挂载（v-if，长数组收起时零渲染成本） -->
    <div v-if="open" class="ml-3 border-l border-[var(--color-border)] pl-3">
      <template v-if="node.type === 'object'">
        <div v-for="(p, i) in node.properties" :key="i" class="flex items-start gap-1.5 py-px">
          <span class="shrink-0 font-mono text-[var(--color-accent)]">"{{ p.key }}"</span>
          <span class="shrink-0 text-[var(--color-text-muted)]">:</span>
          <JsonTree :node="p.value" :depth="depth + 1" />
        </div>
      </template>
      <template v-else>
        <div v-for="(item, i) in node.items" :key="i" class="flex items-start gap-1.5 py-px">
          <span class="shrink-0 font-mono text-[var(--color-text-muted)]">{{ i }}:</span>
          <JsonTree :node="item" :depth="depth + 1" />
        </div>
      </template>
    </div>
  </div>

  <!-- 叶子节点：字符串 / 数字（含精度提示） / 布尔 / null -->
  <div v-else class="flex min-w-0 flex-wrap items-center gap-1.5">
    <span class="w-3 shrink-0"></span>
    <span v-if="node.type === 'string'" class="break-all font-mono text-[var(--color-text-primary)]">
      "{{ node.value }}"
    </span>
    <template v-else-if="node.type === 'number'">
      <!-- raw 原文直出：数字显示永不经 JS number 中转 -->
      <span class="break-all font-mono text-[var(--color-accent-yellow)]">{{ node.raw }}</span>
      <span
        v-if="isUnsafeRawNumber(node.raw)"
        class="shrink-0 rounded border border-[var(--color-accent-magenta)] px-1 text-xs text-[var(--color-accent-magenta)]"
        :title="PRECISION_HINT"
      >
        JS 精度不安全
      </span>
    </template>
    <span v-else-if="node.type === 'boolean'" class="font-mono text-[var(--color-accent-magenta)]">
      {{ node.value }}
    </span>
    <span v-else class="font-mono text-[var(--color-accent-magenta)]">null</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TreeNode } from '../json-formatter.service'

defineOptions({ name: 'JsonTree' })

/** 默认展开深度：root(0) 与第一层(1) 展开，≥2 默认收起（D-02 电商深层嵌套场景） */
const DEFAULT_EXPAND_DEPTH = 2
/** JS number 安全整数上限（2^53） */
const UNSAFE_NUMBER_THRESHOLD = 2 ** 53
const PRECISION_HINT = '该数字绝对值 ≥ 2^53，超出 JS number 安全整数范围；此处为原文文本保真显示'

const props = withDefaults(defineProps<{ node: TreeNode; depth?: number }>(), { depth: 0 })

const open = ref(props.depth < DEFAULT_EXPAND_DEPTH)

/**
 * 精度提示判定：Number(raw) 仅做阈值比较（展示提示），node.raw 原文永不经
 * number 转换回写 —— 渲染值始终是 raw 字符串本身。
 */
function isUnsafeRawNumber(raw: string): boolean {
  return Math.abs(Number(raw)) >= UNSAFE_NUMBER_THRESHOLD
}
</script>
