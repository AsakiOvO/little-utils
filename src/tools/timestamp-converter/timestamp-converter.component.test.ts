// src/tools/timestamp-converter/timestamp-converter.component.test.ts
// CR-01 渲染期回归：手填非法 IANA 时区 → role=alert 结构化错误卡而非渲染期崩溃。
// service 层守卫（ok:false 收敛）保证 computed 不抛异常；错误卡 v-if UI 在
// timestamp-converter.vue 已就绪（本文件零改动该组件）。选择器一律用 aria-label
// 属性选择器（不依赖 DOM 顺序/索引）；组件不使用 RouterLink、useCopy legacy
// 语义下 setup 无需剪贴板 mock（01-02 SUMMARY：isSupported 恒 true）。
// 浏览器端人工走查由 01-VERIFICATION.md human_verification 第 2 项在阶段末收口。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimestampConverter from './timestamp-converter.vue'

const TZ_SELECT = 'select[aria-label="目标时区（换算视图，可选）"]'
const TZ_CUSTOM_INPUT = 'input[aria-label="自定义目标 IANA 时区名"]'
const TS_INPUT = 'input[aria-label="Unix 时间戳输入"]'
const DT_TZ_SELECT = 'select[aria-label="解析时区（默认浏览器本地时区）"]'
const DT_TZ_CUSTOM_INPUT = 'input[aria-label="自定义解析 IANA 时区名"]'
const DT_INPUT = 'input[aria-label="日期时间输入"]'

describe('手填非法时区渲染期回归（CR-01：错误卡而非白屏/崩溃）', () => {
  it('正向：手填 UTC+8 显示 role=alert 错误卡，结果卡不渲染，组件不崩溃', async () => {
    const wrapper = mount(TimestampConverter)
    await wrapper.find(TZ_SELECT).setValue('__custom__')
    await wrapper.find(TZ_CUSTOM_INPUT).setValue('UTC+8')
    await wrapper.find(TS_INPUT).setValue('1735689600000')
    await nextTick()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('未知时区')
    // 结果卡不渲染（ok:false 分支），原始输入回显随之缺席
    expect(wrapper.text()).not.toContain('识别为')
  })

  it('反向：手填 Foo/Bar 显示 role=alert 错误卡，毫秒/秒结果区不渲染', async () => {
    const wrapper = mount(TimestampConverter)
    await wrapper.find(DT_TZ_SELECT).setValue('__custom__')
    await wrapper.find(DT_TZ_CUSTOM_INPUT).setValue('Foo/Bar')
    await wrapper.find(DT_INPUT).setValue('2025-01-01 08:00:00')
    await nextTick()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('未知时区')
    // 结果区不渲染（ok:false 分支）
    expect(wrapper.text()).not.toContain('毫秒时间戳')
  })

  it('有效路径健全性：正常毫秒输入仍回显「识别为毫秒」（修复未破坏正常回显）', async () => {
    const wrapper = mount(TimestampConverter)
    await wrapper.find(TS_INPUT).setValue('1735689600000')
    await nextTick()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('识别为毫秒')
  })
})
