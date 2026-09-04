<!-- CodeMirror 6 JSON 编辑器封装（D-01，RESEARCH §Pattern 3 逐项） -->
<!-- 懒加载边界：CM 包仅被本组件静态 import → 只落进 json-formatter 工具 chunk；
     共享层（ui/composables/utils/pages/layouts）出现任何引用即违反 ARCH-02（Pitfall 2）。 -->
<!-- vite-ssg 纪律：onMounted 才创建 EditorView（Node 预渲染无 DOM 不创建），
     onBeforeUnmount 销毁置 null；watch 单向同步（值不同才 dispatch，避免回环）。 -->
<template>
  <div
    ref="host"
    class="min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] text-sm"
  ></div>
</template>

<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const host = ref<HTMLElement | null>(null)
let view: EditorView | null = null

// 编辑器填满宿主容器并在内部滚动（长 JSON 不撑爆双栏布局）
const fitHeightTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
})

onMounted(() => {
  const el = host.value
  if (!el) return
  view = new EditorView({
    extensions: [
      basicSetup, // 行号 + 语法高亮基座
      json(), // JSON 语法
      linter(jsonParseLinter()), // 错误定位（行内标记 + gutter）
      oneDark, // 暗底站点开箱即用；Phase 2 亮色主题再按 EditorView.theme 定制
      fitHeightTheme,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
      }),
    ],
    doc: props.modelValue,
    parent: el,
  })
})

// 外部值 → 编辑器单向同步：值不同才 dispatch（避免 updateListener 回环）
watch(
  () => props.modelValue,
  (v) => {
    const current = view?.state.doc.toString()
    if (view && v !== current) {
      view.dispatch({ changes: { from: 0, to: current?.length ?? 0, insert: v } })
    }
  },
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>
