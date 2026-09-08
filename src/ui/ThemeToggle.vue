<!-- src/ui/ThemeToggle.vue —— 三态循环图标按钮(D-02/D-03,SITE-04)
     暗色=月亮 / 亮色=太阳 / 跟随系统=显示器,点击经 useThemeMode().cycle() 循环;
     图标 aria-hidden(装饰性),语义全部在 aria-label(D-19);44px 触控目标(D-21,min-h/min-w-11);
     按需显式 import、无 barrel(D-18);无 glow 类(D-08 组件克制);
     transition-colors 仅服务 hover 渐变——D-11 禁的是主题切换全局过渡(瞬切窗口由 .theme-switching 配对) -->
<template>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] min-h-11 min-w-11"
    :aria-label="label"
    :title="label"
    @click="cycle()"
  >
    <component :is="icon" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Monitor, Moon, Sun } from '@lucide/vue'
import { useThemeMode } from '../composables/useThemeMode'

defineOptions({ name: 'ThemeToggle' })

const { preference, cycle } = useThemeMode()

// 图标即状态(D-03/UI-SPEC 图标语义行):aria-hidden 装饰,语义在 aria-label
const icon = computed(() => (preference.value === 'dark' ? Moon : preference.value === 'light' ? Sun : Monitor))

// 三态文案(UI-SPEC Copywriting Contract 锁定,半角括号冒号;auto 文案为「跟随系统」)
const label = computed(() =>
  preference.value === 'dark'
    ? '切换主题(当前:暗色)'
    : preference.value === 'light'
      ? '切换主题(当前:亮色)'
      : '切换主题(当前:跟随系统)',
)
</script>
