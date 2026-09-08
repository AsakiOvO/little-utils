<!-- src/ui/Tabs.vue —— 六件套 WAI-ARIA 标签页（roving tabindex + 方向键 + hidden 面板）
     D-13 六件套 / D-14 SFC 形态：tabs/v-model 契约是 Phase 4/5 分组 UI 的向后兼容面
     D-18 无前缀命名 + 按需显式导入（延续 safe-html 惯例，无 barrel）
     D-19 键盘完整可达（RESEARCH §Pattern 5 / WAI-ARIA tabs pattern）：
       - role 三件套 tablist/tab/tabpanel + tablist 必需命名（aria-label）
       - roving tabindex：仅活动 tab tabindex=0（单一 Tab 停靠点），其余 -1
       - ArrowLeft/Right 循环移动 + Home/End 跳两端，自动激活模式（聚焦即选中，面板廉价默认）
       - aria-selected/tabIndex/panel hidden 三件套全部由 selectTab() 单点驱动（activeId 派生），防状态漂移
       - 非激活面板必须 hidden 属性（禁 opacity/移出屏幕 —— 屏幕阅读器仍可达，违反 4.1.2/1.3.1）；纯静态面板加 tabindex="0"
     D-21 交互件 min-h-11（44px 触控）；tablist overflow-x-auto 超宽水平滚动 + 键盘导航 scrollIntoView 保持活动 tab 可见（UI-SPEC overflow 行）
     受控 v-model 契约（与 Input/CodeMirrorJson 同构）：点击/键盘 emit update:modelValue，
     活动态经父组件回写驱动；未传 modelValue 时以首个 tab 为初始活动态 -->
<template>
  <div>
    <!-- ① tablist：超宽容器水平滚动不换行（overflow-x-auto + whitespace-nowrap） -->
    <div
      ref="tablistRef"
      role="tablist"
      :aria-label="ariaLabel"
      class="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]"
    >
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        :ref="(el) => setTabRef(el, tab.id)"
        type="button"
        role="tab"
        :aria-selected="activeId === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeId === tab.id ? 0 : -1"
        class="inline-flex min-h-11 items-center whitespace-nowrap px-3 text-sm transition-colors"
        :class="
          activeId === tab.id
            ? 'border-b-2 border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
        "
        @click="selectTab(tab.id)"
        @keydown="onKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ② 面板：常驻 DOM（aria-controls 引用始终有效），非激活用 hidden 属性；动态插槽名 = tab.id -->
    <div
      v-for="tab in tabs"
      :id="`panel-${tab.id}`"
      :key="tab.id"
      role="tabpanel"
      :aria-labelledby="`tab-${tab.id}`"
      :hidden="activeId !== tab.id"
      tabindex="0"
      class="pt-3"
    >
      <slot :name="tab.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'Tabs' })

const props = withDefaults(
  defineProps<{
    /** tab 数据契约（D-14）：id 作 panel 插槽名与 aria 关联键，label 为显示文案 */
    tabs: { id: string; label: string }[]
    /** 活动 tab id（v-model 受控契约）；未传时以首个 tab 为初始活动态 */
    modelValue?: string
    /** tablist 可访问名称（WAI-ARIA：role=tablist 必须命名） */
    ariaLabel?: string
  }>(),
  { ariaLabel: '标签页' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

/** 活动态单源：aria-selected/tabIndex/panel hidden 全部由此派生（D-19 防状态漂移） */
const activeId = computed(() => props.modelValue ?? props.tabs[0]?.id)

/** D-19 单点驱动：唯一状态变更入口（emit 后经父组件 v-model 回写 activeId） */
function selectTab(id: string): void {
  emit('update:modelValue', id)
}

/** tab 元素注册表：键盘导航后聚焦/滚动定位与 id 契约解耦（不经全局 DOM 查询） */
const tablistRef = ref<HTMLElement | null>(null)
const tabEls = new Map<string, HTMLElement>()

function setTabRef(el: unknown, id: string): void {
  if (el instanceof HTMLElement) tabEls.set(id, el)
  else tabEls.delete(id)
}

/**
 * 键盘导航（自动激活模式）：←/→ 循环移动（水平布局）、Home/End 跳两端；
 * 选中即 emit；随后聚焦新 tab 并 scrollIntoView 保持焦点可见（UI-SPEC overflow 行）。
 */
function onKeydown(event: KeyboardEvent, index: number): void {
  const count = props.tabs.length
  if (count === 0) return
  let next: number | null = null
  if (event.key === 'ArrowRight') next = (index + 1) % count
  else if (event.key === 'ArrowLeft') next = (index - 1 + count) % count
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = count - 1
  if (next === null) return
  event.preventDefault()
  const target = props.tabs[next]
  if (!target) return
  selectTab(target.id)
  const el = tabEls.get(target.id)
  el?.focus()
  // scrollIntoView 守卫：宿主环境缺实现时不阻断导航（真实浏览器恒有此 API）
  if (typeof el?.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}
</script>
