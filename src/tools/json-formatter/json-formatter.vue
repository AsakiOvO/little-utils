<!-- JSON 格式化工具页（TOOL-01）：双栏视图（D-02）——左栏 CodeMirror 输入，右栏格式化文本 + 树形视图 -->
<!-- 渲染纪律（ARCH-04/T-01-01）：一切输出（格式化文本/树/错误卡/含脚本标签的字符串值）
     全部经 Vue 文本插值渲染（vnode 自动转义），零 HTML 字符串构造。 -->
<!-- 数据纪律：格式化文本与 JsonTree 由同一个 computed 解析结果驱动（一次 service 调用，D-02）；
     解析失败渲染结构化错误卡（line/column/message，来自 validateJson）。 -->
<!-- 样式纪律：只消费 @theme 语义变量，tool.layout 内保持克制（Pitfall 4:零 glow） -->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-xl font-semibold text-[var(--color-text-primary)]">JSON 格式化</h1>
      <p class="text-sm text-[var(--color-text-muted)]">
        JSON 校验、格式化与压缩，浏览器本地完成；长数字 ID 逐字保留，不丢精度。
      </p>
    </header>

    <div class="flex flex-col gap-6 xl:flex-row">
      <!-- ── 左栏：CodeMirror 输入区（D-01，随本工具 chunk 懒加载） ── -->
      <section class="flex min-w-0 flex-1 flex-col gap-3 xl:h-[560px]" aria-label="JSON 输入">
        <div class="flex flex-wrap items-center gap-2">
          <!-- D-15 迁移：格式化/压缩按钮换用六件套 Button（outline，hover accent/disabled 语义组件内建，
               py-1.5 存量随迁归一为 min-h-11 44px 触控，D-21/02-06 deferred-items 既定迁移面） -->
          <Button variant="outline" :disabled="!hasResult" @click="applyFormatted">格式化</Button>
          <Button variant="outline" :disabled="!hasResult" @click="applyMinified">压缩</Button>
        </div>
        <CodeMirrorJson v-model="input" />
      </section>

      <!-- ── 右栏：输出视图（同一份 parsed 解析结果） ── -->
      <section class="flex min-w-0 flex-1 flex-col gap-4 xl:h-[560px] xl:overflow-y-auto" aria-label="格式化输出">
        <!-- 结构化错误卡：line/column/message（透明性禁令：报错而非静默修正）
             D-15/D-10 迁移：错误态消费 danger 语义色（UI-SPEC Destructive 行——校验失败属 Destructive 语义，不直连霓虹品红原语） -->
        <div
          v-if="parsed && !parsed.ok"
          role="alert"
          class="flex flex-col gap-1 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-primary)]"
        >
          <p>{{ parsed.error.message }}</p>
          <p class="font-mono text-[var(--color-danger)]">
            第 {{ parsed.error.line }} 行 · 第 {{ parsed.error.column }} 列
          </p>
        </div>

        <!-- 空输入提示（空输入不崩溃：ARCH-01/empty 同源边界） -->
        <p
          v-else-if="!parsed"
          class="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]"
        >
          在左侧输入或粘贴 JSON，自动校验并格式化。
        </p>

        <!-- 结果：格式化文本块 + 树形视图，数据源同为 parsed（一次 service 调用） -->
        <template v-else>
          <!-- D-15 迁移：卡容器换用 Card(:padding=false + p-3 定制,02-06 deferred 授权形态)；
               复制按钮 + 展示区合并为 CopyableText（D-17 逻辑收进组件,D-21 按钮 44px,成功反馈内置） -->
          <Card :padding="false" class="flex flex-col gap-2 p-3">
            <span class="text-sm text-[var(--color-text-muted)]">格式化文本</span>
            <!-- 插值直出（T-01-01/T-02-11）：CopyableText 展示区同为 {{ }} 插值（禁 v-html），
                 含 <script>/事件属性的字符串值只会是纯文本 -->
            <CopyableText :text="parsed.formatted" label="复制格式化文本" />
          </Card>

          <!-- D-15 迁移：树形卡同格式化卡形态；展示区=树（默认插槽），复制 payload=minified 全文
               ——复制能力与展示解耦但同源（同一份 parsed 解析结果驱动） -->
          <Card :padding="false" class="flex flex-col gap-2 p-3">
            <span class="text-sm text-[var(--color-text-muted)]">树形视图</span>
            <CopyableText :text="parsed.minified" label="复制压缩结果">
              <div class="overflow-x-auto text-sm">
                <JsonTree :node="parsed.tree" :depth="0" />
              </div>
            </CopyableText>
          </Card>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../../ui/Button.vue'
import CopyableText from '../../ui/CopyableText.vue'
import Card from '../../ui/Card.vue'
import CodeMirrorJson from './components/CodeMirrorJson.vue'
import JsonTree from './components/JsonTree.vue'
import {
  buildTree,
  formatJson,
  minifyJson,
  validateJson,
  type JsonError,
  type TreeNode,
} from './json-formatter.service'

/** 单次解析结果：错误形态 / 结果形态（formatted + minified + tree 同源） */
type ParseOutcome =
  | { ok: true; formatted: string; minified: string; tree: TreeNode }
  | { ok: false; error: JsonError }
  | null

const input = ref('')

/**
 * 唯一解析入口：validateJson →（合法时）formatJson + minifyJson + buildTree。
 * 右栏两个视图与写回按钮全部消费这一个 computed（D-02：同一次 service 调用）。
 */
const parsed = computed<ParseOutcome>(() => {
  const text = input.value
  if (!text.trim()) return null
  const v = validateJson(text)
  if (!v.ok) {
    return { ok: false, error: v.error ?? { line: 1, column: 1, message: '未知校验错误' } }
  }
  return { ok: true, formatted: formatJson(text, 2), minified: minifyJson(text), tree: buildTree(text) }
})

const hasResult = computed(() => parsed.value?.ok === true)

// 格式化/压缩：把结果写回输入区（编辑器内容即新 JSON）
function applyFormatted(): void {
  const r = parsed.value
  if (r?.ok) input.value = r.formatted
}

function applyMinified(): void {
  const r = parsed.value
  if (r?.ok) input.value = r.minified
}
</script>
