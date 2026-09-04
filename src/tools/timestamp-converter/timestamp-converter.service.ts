// src/tools/timestamp-converter/timestamp-converter.service.ts
// TOOL-02 服务层：秒/毫秒识别 + 双向转换 + 时区显示（RESEARCH §Pattern 7）。
// 纪律：零 Vue/DOM 依赖；浏览器 API（dayjs.tz.guess()）只出现在函数体内
//（Pitfall 3：vite-ssg 预渲染跑在 Node，模块顶层碰环境 API 构建即炸）。
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 官方插件依赖顺序：utc 必须先于 timezone（写错时区换算全错 — T-01-07）。
// extend 是纯插件注册（非浏览器 API），模块顶层执行安全。
dayjs.extend(utc)
dayjs.extend(timezone)

/** 识别结果：秒 / 毫秒 / 非法 */
export type DetectedUnit = 's' | 'ms' | 'invalid'

/** fromTimestamp 结构化返回（V7：非法输入返回 ok:false + error，不裸抛） */
export interface FromTimestampResult {
  ok: boolean
  error: string | null
  /** 识别出的单位（非法输入为 null） */
  detectedUnit: DetectedUnit | null
  /** 浏览器本地时区时间 'YYYY-MM-DD HH:mm:ss' */
  local: string | null
  /** UTC 时间 'YYYY-MM-DD HH:mm:ss' */
  utc: string | null
  /** 本地时区 Z 偏移，如 '+08:00' */
  offset: string | null
  /** IANA 时区名，如 'Asia/Shanghai' */
  timeZone: string | null
  /** 目标时区时间 'YYYY-MM-DD HH:mm:ss Z'（未指定目标时区时为 null） */
  target: string | null
}

/** toTimestamp 结构化返回（V7：非法输入返回 ok:false + error，不裸抛） */
export interface ToTimestampResult {
  ok: boolean
  error: string | null
  /** 毫秒时间戳 */
  ms: number | null
  /** 秒时间戳 */
  sec: number | null
}

/**
 * 按位数启发判定秒/毫秒：≤11 位按秒、12-14 位按毫秒、其余非法
 *（12 位毫秒为 1970 年代日期，属已知边界——判定结果必须由 UI 回显防 1000 倍错判）。
 * 正则限整数（含负数）；空/非数字/超 14 位一律 invalid。
 */
export function detectUnit(ts: string): DetectedUnit {
  if (!/^-?\d+$/.test(ts.trim())) return 'invalid'
  const len = ts.replace('-', '').length
  if (len <= 11) return 's'
  if (len <= 14) return 'ms'
  return 'invalid'
}

/**
 * 时间戳 → 日期时间。显示浏览器本地时区、UTC、Z 偏移与 IANA 时区名；
 * 可选目标时区（IANA 名）换算视图。
 */
export function fromTimestamp(ts: string, tz?: string): FromTimestampResult {
  const unit = detectUnit(ts)
  if (unit === 'invalid') {
    return {
      ok: false,
      error: `无法识别的时间戳：「${ts}」需为 ≤14 位整数（≤11 位按秒、12-14 位按毫秒）。`,
      detectedUnit: null,
      local: null,
      utc: null,
      offset: null,
      timeZone: null,
      target: null,
    }
  }

  // unit 已收窄为 's' | 'ms'；≤14 位整数经 Number 转换无精度损失（< 2^53）
  const d = unit === 's' ? dayjs.unix(Number(ts)) : dayjs(Number(ts))
  return {
    ok: true,
    error: null,
    detectedUnit: unit,
    local: d.format('YYYY-MM-DD HH:mm:ss'),
    utc: d.utc().format('YYYY-MM-DD HH:mm:ss'),
    offset: d.format('Z'),
    timeZone: dayjs.tz.guess(),
    target: tz ? d.tz(tz).format('YYYY-MM-DD HH:mm:ss Z') : null,
  }
}

/** 日期时间 → 时间戳（毫秒与秒两种粒度）；可选目标时区（IANA 名）解析。 */
export function toTimestamp(input: string, tz?: string): ToTimestampResult {
  const d = tz ? dayjs.tz(input, tz) : dayjs(input)
  if (!d.isValid()) {
    return {
      ok: false,
      error: `无法解析的日期时间：「${input}」。`,
      ms: null,
      sec: null,
    }
  }
  return { ok: true, error: null, ms: d.valueOf(), sec: d.unix() }
}
