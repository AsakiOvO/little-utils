<!-- 时间戳转换工具页（TOOL-02）:双向转换 + 识别回显 + 时区选择 + 一键复制 -->
<!-- 渲染纪律（ARCH-04/T-01-05）:全部输出经 Vue 文本插值（vnode 自动转义），零 HTML 字符串构造 -->
<!-- 样式纪律:只消费 @theme 语义变量，tool.layout 内保持克制（Pitfall 4:零 glow） -->
<template>
  <div class="flex flex-col gap-10">
    <header class="flex flex-col gap-1">
      <h1 class="text-xl font-semibold text-[var(--color-text-primary)]">时间戳转换</h1>
      <p class="text-sm text-[var(--color-text-muted)]">
        Unix 时间戳与日期时间双向转换，所有计算均在浏览器本地完成。
      </p>
    </header>

    <!-- ── 正向：时间戳 → 日期时间 ─────────────────────────── -->
    <section class="flex flex-col gap-4" aria-labelledby="forward-heading">
      <h2 id="forward-heading" class="text-lg font-semibold text-[var(--color-text-primary)]">
        时间戳 → 日期时间
      </h2>

      <input
        v-model="tsInput"
        type="text"
        inputmode="numeric"
        placeholder="输入 Unix 时间戳，如 1735689600000（毫秒）或 1735689600（秒）"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-base text-[var(--color-text-primary)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-cyan)]"
        aria-label="Unix 时间戳输入"
      />

      <!-- 目标时区下拉（A6:降级为常用列表 + 手填 IANA 名） -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          v-model="selectedTz"
          class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-neon-cyan)]"
          aria-label="目标时区（换算视图，可选）"
        >
          <option value="">不指定目标时区</option>
          <option v-for="tz in timezoneOptions" :key="tz" :value="tz">{{ tz }}</option>
          <option value="__custom__">手动输入 IANA 时区…</option>
        </select>
        <input
          v-if="selectedTz === '__custom__'"
          v-model="forwardCustomTz"
          type="text"
          placeholder="手动输入 IANA 时区名，如 Asia/Shanghai"
          class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-mono text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-cyan)] sm:flex-1"
          aria-label="自定义目标 IANA 时区名"
        />
      </div>

      <!-- 结构化错误卡（透明性禁令:非法输入报错而非静默/崩溃） -->
      <div
        v-if="forwardResult && !forwardResult.ok"
        role="alert"
        class="rounded-lg border border-[var(--color-accent-magenta)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-primary)]"
      >
        {{ forwardResult.error }}
      </div>

      <!-- 结果区:识别回显（单位 + 原始输入）+ 本地/UTC/偏移/时区/目标时区 -->
      <div
        v-else-if="forwardResult && forwardResult.ok"
        class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-mono text-sm text-[var(--color-accent-yellow)]">
            识别为{{ unitLabel(forwardResult.detectedUnit) }} · 原始输入「{{ tsInput }}」
          </p>
          <button
            type="button"
            class="rounded-md border px-2 py-1 text-xs transition-colors"
            :class="
              isCopied('__all__')
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-accent)]'
            "
            aria-label="复制全部结果文本"
            @click="copyValue('__all__', forwardFullText)"
          >
            {{ isCopied('__all__') ? '已复制' : '复制全部' }}
          </button>
        </div>

        <div
          v-for="row in forwardRows"
          :key="row.key"
          class="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2 first:border-t-0 first:pt-0"
        >
          <span class="text-sm text-[var(--color-text-muted)]">{{ row.label }}</span>
          <span class="flex items-center gap-2">
            <span class="font-mono text-sm text-[var(--color-text-primary)]">{{ row.value }}</span>
            <button
              type="button"
              class="rounded-md border px-2 py-1 text-xs transition-colors"
              :class="
                isCopied(row.key)
                  ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]'
              "
              :aria-label="`复制${row.label}`"
              @click="copyValue(row.key, row.value)"
            >
              {{ isCopied(row.key) ? '已复制' : '复制' }}
            </button>
          </span>
        </div>
      </div>
    </section>

    <!-- ── 反向：日期时间 → 时间戳 ─────────────────────────── -->
    <section class="flex flex-col gap-4" aria-labelledby="reverse-heading">
      <h2 id="reverse-heading" class="text-lg font-semibold text-[var(--color-text-primary)]">
        日期时间 → 时间戳
      </h2>

      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          v-model="dtInput"
          type="text"
          placeholder="输入日期时间，如 2025-01-01 08:00:00"
          class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-base text-[var(--color-text-primary)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-cyan)] sm:flex-1"
          aria-label="日期时间输入"
        />
        <select
          v-model="dtTz"
          class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-neon-cyan)]"
          aria-label="解析时区（默认浏览器本地时区）"
        >
          <option value="">本地时区（{{ guessedTz }}）</option>
          <option v-for="tz in timezoneOptions" :key="tz" :value="tz">{{ tz }}</option>
          <option value="__custom__">手动输入 IANA 时区…</option>
        </select>
      </div>

      <input
        v-if="dtTz === '__custom__'"
        v-model="dtCustomTz"
        type="text"
        placeholder="手动输入 IANA 时区名，如 Asia/Shanghai"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-cyan)]"
        aria-label="自定义解析 IANA 时区名"
      />

      <!-- 结构化错误卡 -->
      <div
        v-if="reverseResult && !reverseResult.ok"
        role="alert"
        class="rounded-lg border border-[var(--color-accent-magenta)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-primary)]"
      >
        {{ reverseResult.error }}
      </div>

      <!-- 结果:毫秒 + 秒两种粒度 -->
      <div
        v-else-if="reverseResult && reverseResult.ok"
        class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <div
          v-for="row in reverseRows"
          :key="row.key"
          class="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2 first:border-t-0 first:pt-0"
        >
          <span class="text-sm text-[var(--color-text-muted)]">{{ row.label }}</span>
          <span class="flex items-center gap-2">
            <span class="font-mono text-sm text-[var(--color-text-primary)]">{{ row.value }}</span>
            <button
              type="button"
              class="rounded-md border px-2 py-1 text-xs transition-colors"
              :class="
                isCopied(row.key)
                  ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]'
              "
              :aria-label="`复制${row.label}`"
              @click="copyValue(row.key, row.value)"
            >
              {{ isCopied(row.key) ? '已复制' : '复制' }}
            </button>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCopy } from '../../composables/useCopy'
import { fromTimestamp, toTimestamp, type DetectedUnit } from './timestamp-converter.service'

const { copy, copied } = useCopy()
// 多行结果各自反馈:记录最后复制行的 key,copied 窗口内该行显示「已复制」
const lastCopiedKey = ref<string | null>(null)

async function copyValue(key: string, value: string): Promise<void> {
  await copy(value)
  lastCopiedKey.value = key
}

function isCopied(key: string): boolean {
  return copied.value && lastCopiedKey.value === key
}

// ── 时区选项（A6 特性检测:supportedValuesOf 不可用时降级常用列表 + 手填） ──
// Intl 调用保持在 setup/函数体内（Pitfall 3 纪律;Node/浏览器均有 Intl,SSG 预渲染安全）
const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Seoul',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
]

/** Intl.supportedValuesOf 属 ES2022.Intl（本项目 lib 为 ES2020,以 intersection type 手动声明） */
function detectIntlTimezones(): string[] | null {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }
    if (typeof intl.supportedValuesOf === 'function') {
      const list = intl.supportedValuesOf('timeZone')
      if (list.length > 0) return [...list]
    }
  } catch {
    // 特性检测失败 → 降级
  }
  return null
}

const timezoneOptions = detectIntlTimezones() ?? FALLBACK_TIMEZONES
// 浏览器本地 IANA 时区名（经 service 函数体内调用 dayjs.tz.guess()）
const guessedTz = computed(() => fromTimestamp('0').timeZone ?? '')

// ── 正向：时间戳 → 日期时间（输入即算） ──────────────────────
const tsInput = ref('')
const selectedTz = ref('') // 目标时区（'' = 不展示目标时区行）
const forwardCustomTz = ref('')
const effectiveForwardTz = computed(() =>
  selectedTz.value === '__custom__' ? forwardCustomTz.value.trim() : selectedTz.value,
)

const forwardResult = computed(() =>
  tsInput.value.trim() ? fromTimestamp(tsInput.value.trim(), effectiveForwardTz.value || undefined) : null,
)

const forwardRows = computed(() => {
  const r = forwardResult.value
  if (!r?.ok) return []
  // ok:true 分支下 service 保证各字段非 null;?? '' 仅为类型层兜底（copy 不接受 null）
  const rows = [
    { key: 'local', label: '本地时间', value: r.local ?? '' },
    { key: 'utc', label: 'UTC 时间', value: r.utc ?? '' },
    { key: 'offset', label: 'UTC 偏移', value: r.offset ?? '' },
    { key: 'timeZone', label: 'IANA 时区', value: r.timeZone ?? '' },
  ]
  if (r.target) {
    rows.push({
      key: 'target',
      label: `目标时区（${effectiveForwardTz.value}）`,
      value: r.target,
    })
  }
  return rows
})

// 复制全部:格式化的结果文本行(原始输入 + 识别结论 + 本地/UTC/偏移/时区)
const forwardFullText = computed(() => {
  const r = forwardResult.value
  if (!r?.ok) return ''
  const lines = [
    `原始输入：${tsInput.value}`,
    `识别为：${unitLabel(r.detectedUnit)}`,
    `本地时间：${r.local ?? ''}`,
    `UTC 时间：${r.utc ?? ''}`,
    `UTC 偏移：${r.offset ?? ''}`,
    `IANA 时区：${r.timeZone ?? ''}`,
  ]
  if (r.target) lines.push(`目标时区（${effectiveForwardTz.value}）：${r.target}`)
  return lines.join('\n')
})

// ── 反向：日期时间 → 时间戳（输入即算） ──────────────────────
const dtInput = ref('')
const dtTz = ref('') // 解析时区（'' = 浏览器本地时区）
const dtCustomTz = ref('')
const effectiveDtTz = computed(() =>
  dtTz.value === '__custom__' ? dtCustomTz.value.trim() : dtTz.value,
)

const reverseResult = computed(() =>
  dtInput.value.trim()
    ? toTimestamp(dtInput.value.trim(), effectiveDtTz.value || undefined)
    : null,
)

const reverseRows = computed(() => {
  const r = reverseResult.value
  if (!r?.ok) return []
  return [
    { key: 'ms', label: '毫秒时间戳', value: String(r.ms) },
    { key: 'sec', label: '秒时间戳', value: String(r.sec) },
  ]
})

function unitLabel(unit: DetectedUnit | null): string {
  if (unit === 's') return '秒（≤11 位）'
  if (unit === 'ms') return '毫秒（12-14 位）'
  return '无法识别'
}
</script>
