<!-- src/ui/CopyableText.vue —— 六件套复制展示组件（D-17 能力层/展示层分离 + 成功/失败/空内容三态反馈）
     D-13 六件套 / D-14 SFC 形态：复制反馈契约是 Phase 5 输出类工具与 plan 02-07 迁移的向后兼容面
     D-17 复制逻辑零重写：内部消费 useCopy()（禁裸调 navigator.clipboard，降级链由能力层负责）
     D-18 无前缀命名 + 按需显式导入（延续 safe-html 惯例，无 barrel）
     D-19 交互件 min-h-11（44px 触控）+ aria-label 约定 + aria-live 反馈；焦点环依赖 base.css 全局 :focus-visible
     渲染纪律（ARCH-04 / RESEARCH §Security V5 / T-02-06）：展示区一律 {{ }} 插值（自动转义），禁 v-html
     失败态语义（RESEARCH §Pitfall 5 实证 VueUse 14.4.0）：useClipboard(legacy:true) 内部吞掉
     clipboard.write 失败并转 execCommand 降级，copy() 仅在降级 execCommand 本身抛错时 reject ——
     failed 是该真实拒绝路径的终态反馈（双层降级仍失败，UI-SPEC error 行） -->
<template>
  <div class="flex flex-col gap-2">
    <!-- ① 展示区：默认插槽优先；无插槽时 fallback 限高内部滚动（复制始终传 props.text 全文，不截断于可见区） -->
    <slot>
      <pre class="max-h-72 overflow-auto whitespace-pre font-mono text-sm break-words text-[var(--color-text-primary)]">{{ text }}</pre>
    </slot>

    <!-- ② 复制按钮：图标即语义（aria-label 承载文案）；空内容禁用（UI-SPEC 空内容态） -->
    <button
      type="button"
      class="self-start inline-flex items-center gap-1 min-h-11 rounded-md border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      :class="
        copied
          ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]'
      "
      :aria-label="text ? label : '暂无内容可复制'"
      :disabled="!text"
      @click="onClick"
    >
      <Check v-if="copied" class="size-4" aria-hidden="true" />
      <Copy v-else class="size-4" aria-hidden="true" />
    </button>

    <!-- ③ 反馈：常驻 aria-live 区域（公告要求节点先于内容存在）；常态 sr-only，成功/失败切换为可见 -->
    <span aria-live="polite" :class="feedbackClasses">{{ feedbackText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { useCopy } from '../composables/useCopy'

defineOptions({ name: 'CopyableText' })

const props = withDefaults(defineProps<{ /** 复制 payload 与展示内容（必传） */ text: string; /** 复制按钮 aria-label，可定制 */ label?: string }>(), {
  label: '复制内容',
})

// D-17：复制逻辑零重写 —— copy/copied/copiedDuring(1500ms) 全部来自能力层
const { copy, copied } = useCopy()

/** 失败终态（useCopy 真实拒绝路径，见头注释）；每次点击尝试前复位，避免与成功反馈叠加 */
const failed = ref(false)

async function onClick(): Promise<void> {
  failed.value = false
  try {
    await copy(props.text)
  } catch {
    failed.value = true
  }
}

/** 反馈单源：failed 优先于 copied（失败点击可能落在前次成功的 1500ms 窗口内，最近一次操作为准） */
const feedback = computed<'idle' | 'success' | 'error'>(() => {
  if (failed.value) return 'error'
  if (copied.value) return 'success'
  return 'idle'
})

const feedbackClasses = computed(() => {
  if (feedback.value === 'success') return 'text-sm text-[var(--color-neon-cyan)]'
  if (feedback.value === 'error') return 'text-sm text-[var(--color-danger)]'
  return 'sr-only'
})

const feedbackText = computed(() => {
  if (feedback.value === 'success') return '已复制'
  if (feedback.value === 'error') return '复制失败,请手动复制'
  return ''
})
</script>
