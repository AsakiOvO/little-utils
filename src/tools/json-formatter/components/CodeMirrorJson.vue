<!-- CodeMirror 6 JSON 编辑器封装（D-01，RESEARCH §Pattern 3 逐项） -->
<!-- 懒加载边界：CM 包仅被本组件静态 import → 只落进 json-formatter 工具 chunk；
     共享层（ui/composables/utils/pages/layouts）出现任何引用即违反 ARCH-02（Pitfall 2）。
     主题模块在 ./cm-theme.ts，仅本目录可 import。 -->
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
import { Compartment } from '@codemirror/state'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeMode } from '../../../composables/useThemeMode'
import { createCmTheme } from './cm-theme'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const host = ref<HTMLElement | null>(null)
let view: EditorView | null = null

// 亮暗双主题经 Compartment 挂载：站点主题 resolved 变化时 reconfigure，不重建视图
// （输入/光标/滚动状态无损，D-06；工具目录消费共享 useThemeMode 合法——方向为工具→共享）。
const { resolved } = useThemeMode()
const themeComp = new Compartment()

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
      themeComp.of(createCmTheme(resolved.value === 'dark')), // 亮暗双主题，初始对齐当前 resolved（D-06）
      fitHeightTheme,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
      }),
    ],
    doc: props.modelValue,
    parent: el,
  })
})

// 站点主题切换 → Compartment reconfigure 整体换主题（视图不重建，输入/光标无损，D-06）
watch(resolved, (mode) => {
  view?.dispatch({ effects: themeComp.reconfigure(createCmTheme(mode === 'dark')) })
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
