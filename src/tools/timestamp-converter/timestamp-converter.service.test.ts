// src/tools/timestamp-converter/timestamp-converter.service.test.ts
// TOOL-02 服务层测试：秒/毫秒识别边界、双向转换、时区偏移格式、非法输入结构化错误。
// 时区相关断言一律用 dayjs 自身计算对照，避免测试硬编码本机时区。
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { detectUnit, fromTimestamp, toTimestamp } from './timestamp-converter.service'

describe('detectUnit（秒/毫秒识别边界）', () => {
  it('10 位数字识别为秒', () => {
    expect(detectUnit('1735689600')).toBe('s')
  })

  it('13 位数字识别为毫秒', () => {
    expect(detectUnit('1735689600000')).toBe('ms')
  })

  it('负数时间戳合法（识别为秒）', () => {
    expect(detectUnit('-86400')).toBe('s')
  })

  it('非数字输入识别为 invalid', () => {
    expect(detectUnit('abc')).toBe('invalid')
  })

  it('超过 14 位识别为 invalid', () => {
    expect(detectUnit('123456789012345')).toBe('invalid')
  })

  it('空输入识别为 invalid 且不崩溃', () => {
    expect(detectUnit('')).toBe('invalid')
  })
})

describe('fromTimestamp（时间戳 → 日期时间）', () => {
  it('epoch 0：detectedUnit/utc/offset/timeZone 结构完整', () => {
    const r = fromTimestamp('0')
    expect(r.ok).toBe(true)
    expect(r.detectedUnit).toBe('s')
    expect(r.utc).toBe('1970-01-01 00:00:00')
    expect(r.offset).toBeTruthy()
    expect(r.timeZone).toBe(dayjs.tz.guess())
  })

  it('local 字段与 dayjs 本地格式一致（dayjs 自身对照，不硬编码本机时区）', () => {
    const r = fromTimestamp('0')
    expect(r.local).toBe(dayjs(Number(0)).format('YYYY-MM-DD HH:mm:ss'))
  })

  it('目标时区 UTC：日期部分为 2025-01-01 且偏移含 +00:00 或 Z', () => {
    const r = fromTimestamp('1735689600000', 'UTC')
    expect(r.ok).toBe(true)
    expect(r.target).toBeTruthy()
    expect(r.target).toMatch(/Z|\+00:00/)
    expect(r.target).toContain('2025-01-01')
  })

  it('非法输入返回 ok:false 结构化错误而非抛异常', () => {
    const r = fromTimestamp('abc')
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })
})

describe('toTimestamp（日期时间 → 时间戳）', () => {
  it('Asia/Shanghai 时区解析 2025-01-01 08:00:00 → 1735689600000ms / 1735689600s', () => {
    const r = toTimestamp('2025-01-01 08:00:00', 'Asia/Shanghai')
    expect(r.ok).toBe(true)
    expect(r.ms).toBe(1735689600000)
    expect(r.sec).toBe(1735689600)
  })

  it('非法日期返回 ok:false（结构化错误，不抛异常）', () => {
    const r = toTimestamp('not-a-date')
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })
})

describe('毫秒往返一致性', () => {
  it('fromTimestamp → toTimestamp 往返还原原始毫秒值（本地时区）', () => {
    const local = fromTimestamp('1735689600000').local
    const roundTrip = toTimestamp((local ?? '').replaceAll('-', '/'))
    expect(roundTrip.ms).toBe(1735689600000)
  })
})
