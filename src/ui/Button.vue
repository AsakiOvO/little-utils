<!-- src/ui/Button.vue —— 六件套交互按钮(variant 契约 + 44px 触控 + disabled 语义)
     D-13 六件套 / D-14 SFC 形态:props/variant 契约是 Phase 5 批量工具的向后兼容面,一次定形
     D-16 尺寸体系:size prop 仅 API 留位,单一默认尺寸不实现多档
     D-18 无前缀命名 + 按需显式导入(延续 safe-html 惯例,无 barrel)
     D-19 焦点环依赖 base.css 全局 :focus-visible(经组件层 --color-focus 消费),组件不重复声明
     D-21 交互件 min-h-11(44px 触控目标);长文案自然换行不截断(UI-SPEC long-text backstop)
     禁 glow(D-08:工具操作区克制);hover 过渡为组件级用途(D-11 不受限,受 base.css reduced-motion 全局中和覆盖) -->
<template>
  <button
    type="button"
    class="inline-flex items-center justify-center gap-1.5 min-h-11 rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    :class="variantClasses"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// D-13/D-18 命名契约:组件名与文件名一致(单名无前缀)。项目 SFC-only + 显式 import(D-18),
// 无 in-DOM 模板歧义,与原生 <button> 大小写分明 —— no-reserved-component-names 误报豁免见 .oxlintrc.json overrides。
defineOptions({ name: 'Button' })

/** variant 契约(D-14 向后兼容面):outline 描边按钮 / ghost 幽灵按钮 */
type ButtonVariant = 'outline' | 'ghost'
/** D-16:size 仅 API 留位,单一默认尺寸起步 */
type ButtonSize = 'md'

const props = withDefaults(defineProps<{ variant?: ButtonVariant; size?: ButtonSize }>(), {
  variant: 'outline',
  size: 'md',
})

/** variant 差异类(与 json-formatter 格式化按钮 / tool.layout 返回键的视觉语言对齐):
 *  outline = 描边 + hover 霓虹青;ghost = 无边框 + hover 提亮底色。
 *  不加任何 weight 类(UI-SPEC Typography:weights 全站仅 400/600,按钮继承 400)。 */
const variantClasses = computed(() => {
  if (props.variant === 'ghost') {
    return 'px-3 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
  }
  return 'border border-[var(--color-border)] px-4 text-[var(--color-text-primary)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-accent)]'
})
</script>
