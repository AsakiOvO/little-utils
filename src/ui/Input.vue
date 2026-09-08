<!-- src/ui/Input.vue —— 六件套输入组件(textarea 变体 + label 关联 + v-model + 错误态 aria)
     D-13 六件套 / D-18 无前缀命名 + 按需显式导入(延续 safe-html 惯例)
     D-16 尺寸体系:size prop 仅 API 留位,单一默认尺寸不实现多档
     D-21 组件默认层:控件 text-base(最终渲染 16px,防 iOS 聚焦缩放)+ min-h-11(44px 触控)
     D-19 a11y 内置:label for/id 关联、错误态 aria-invalid + aria-describedby、焦点环经 --color-focus
     D-10 错误态消费 danger 语义色(边框/文案,不直连原语)
     渲染纪律:纯文本插值与 :prop 绑定(零 v-html);错误文案零内置——仅渲染调用方 error prop(UI-SPEC 契约)。
     多根组件(label + 控件 + 错误节点):inheritAttrs: false + 控件上显式 v-bind="$attrs"
     (attrs 透传 type/placeholder 等;控件 id/value/aria 由组件持有,置于 $attrs 之后确保不被覆盖) -->
<template>
  <label v-if="label" :for="id" class="text-sm text-[var(--color-text-muted)]">{{ label }}</label>
  <textarea
    v-if="multiline"
    v-bind="$attrs"
    :id="id"
    rows="4"
    class="min-h-11 w-full rounded-md border bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] transition-colors placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-focus)]"
    :class="controlBorderClasses"
    :value="modelValue"
    :aria-invalid="hasError ? 'true' : undefined"
    :aria-describedby="hasError ? errorId : undefined"
    @input="onInput"
  />
  <input
    v-else
    v-bind="$attrs"
    :id="id"
    class="min-h-11 w-full rounded-md border bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] transition-colors placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-focus)]"
    :class="controlBorderClasses"
    :value="modelValue"
    :aria-invalid="hasError ? 'true' : undefined"
    :aria-describedby="hasError ? errorId : undefined"
    @input="onInput"
  />
  <p v-if="hasError" :id="errorId" class="text-sm text-[var(--color-danger)]">{{ error }}</p>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

// D-13/D-18 命名契约:组件名与文件名一致(单名无前缀)。项目 SFC-only + 显式 import(D-18),
// 无 in-DOM 模板歧义,与原生 <input> 大小写分明 —— no-reserved-component-names 误报豁免见 .oxlintrc.json overrides。
defineOptions({ name: 'Input', inheritAttrs: false })

/** D-16:size 仅 API 留位,单一默认尺寸起步 */
type InputSize = 'md'

const props = withDefaults(
  defineProps<{
    /** v-model 契约(CodeMirrorJson 先例形态) */
    modelValue: string
    /** 传入即渲染 <label :for>,与控件 id 关联(D-19) */
    label?: string
    /** 错误文案由调用方传入(UI-SPEC:组件不内置文案,推荐「{问题说明},请{修正动作}」) */
    error?: string
    /** true 渲染 textarea 变体(D-13) */
    multiline?: boolean
    size?: InputSize
  }>(),
  { multiline: false, size: 'md' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

/** Vue 3.5 useId:SSG/CSR 稳定一致,无第三方依赖 */
const id = useId()

const hasError = computed(() => Boolean(props.error))
const errorId = computed(() => `${id}-error`)

/** 错误态换 danger 边框(D-10);常态 border 语义色;焦点边框经组件层 --color-focus(D-09 不直连原语) */
const controlBorderClasses = computed(() =>
  hasError.value
    ? 'border-[var(--color-danger)]'
    : 'border-[var(--color-border)]',
)

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
