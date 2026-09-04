// src/tools/json-formatter/json-formatter.service.ts — 纯文本 JSON tokenizer（RESEARCH §Pattern 6）
// TOOL-01 的正确性核心：手写四类 token（string/number/punctuation/literal）扫描器，
// 一份解析喂四个功能（格式化/压缩/校验/树形视图）。
//
// 禁令（plan prohibitions / PATTERNS 关键纪律 4，research 定夺勿翻案）：
//   1. 数字 token 原文逐字拷贝为 raw 字符串，永不经 JS number 类型中转
//      （文件内零数值转换调用）—— JSON.parse 对 ≥2^53 整数静默舍入（IEEE 754），
//      电商订单号/雪花 ID 必炸；
//   2. 主路径禁用 JSON 解析+序列化主路径（精度丢失 + 数字型键重排双重破坏）；
//      唯一例外：validateJson 内一处 try/catch 交叉语法校验（结果仅作布尔，绝不进入输出）；
//   3. 不静默修正非法输入（不补引号/不去尾逗号），不重排对象键序，不合并重复键
//      —— 数据保真是本工具的存在理由，静默改写即产品失信。
//
// 纪律：零 Vue/DOM 依赖（Node/SSG 可运行）；validateJson 返回结构化错误不裸抛（V7）。
// 行列号：按 JS 字符串索引（UTF-16 code units）累计，换行符 +1 行归零列，列 1 起。
// 语义边界（01-04 flagged_assumptions 裁定）：重复键保持原文顺序不合并；字符串仅认
// ECMA-404 八种转义；首字符 U+FEFF 忽略、其余位置非法；数字保真仅文本层往返。

/** 结构化错误（V7）：message 非空，line/column 为 1 起行列号 */
export interface JsonError {
  line: number
  column: number
  message: string
}

/** validateJson 宽接口结果（01-02 结构化错误同款形态：ok + error|null，免类型收窄） */
export interface JsonValidateResult {
  ok: boolean
  error: JsonError | null
}

/** 对象属性：键为解码后字符串；重复键按原文出现顺序保留为多个条目 */
export interface TreeProperty {
  key: string
  value: TreeNode
}

/**
 * 树节点（D-02 树形视图数据源）。
 * 数字节点 raw 为原文字符串（契约：raw: string，非 number）——树视图据此零精度显示。
 */
export type TreeNode =
  | { type: 'object'; properties: TreeProperty[] }
  | { type: 'array'; items: TreeNode[] }
  | { type: 'string'; value: string }
  | { type: 'number'; raw: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }

type TokenType = 'string' | 'number' | 'punctuation' | 'literal'

interface Token {
  type: TokenType
  /** 原文逐字拷贝的 token 文本（数字/字符串保真的落点） */
  raw: string
  /** string token 的解码值（键名/字符串值展示用）；其余类型无此字段 */
  value?: string
  /** token 起始索引（UTF-16 code units，错误定位用） */
  start: number
}

/** 内部语法错误：携带行列定位；公共 API 层捕获转为结构化错误 */
class JsonSyntaxError extends Error {
  readonly line: number
  readonly column: number

  constructor(message: string, line: number, column: number) {
    super(message)
    this.name = 'JsonSyntaxError'
    this.line = line
    this.column = column
  }
}

const PUNCTUATORS = new Set(['{', '}', '[', ']', ':', ','])

function isStructuralWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

/** 行列号计算：扫描 index 前的换行符累计行数，列 = index - 行首偏移 + 1 */
function lineColumnAt(text: string, index: number): { line: number; column: number } {
  let line = 1
  let lineStart = 0
  const bound = Math.min(index, text.length)
  for (let i = 0; i < bound; i += 1) {
    if (text.charAt(i) === '\n') {
      line += 1
      lineStart = i + 1
    }
  }
  return { line, column: index - lineStart + 1 }
}

function syntaxError(text: string, index: number, message: string): JsonSyntaxError {
  const { line, column } = lineColumnAt(text, index)
  return new JsonSyntaxError(message, line, column)
}

/**
 * 读取字符串 token：仅认 ECMA-404 八种转义（" \ / b f n r t uXXXX）。
 * 裸控制字符、非法转义、未闭合均报错并定位；解码值仅供展示，raw 原文不变。
 */
function readString(text: string, start: number): { token: Token; next: number } {
  let decoded = ''
  let i = start + 1
  while (i < text.length) {
    const ch = text.charAt(i)
    if (ch === '"') {
      return {
        token: { type: 'string', raw: text.slice(start, i + 1), value: decoded, start },
        next: i + 1,
      }
    }
    if (ch === '\\') {
      const esc = text.charAt(i + 1)
      const escIndex = i
      i += 2
      switch (esc) {
        case '"':
          decoded += '"'
          break
        case '\\':
          decoded += '\\'
          break
        case '/':
          decoded += '/'
          break
        case 'b':
          decoded += '\b'
          break
        case 'f':
          decoded += '\f'
          break
        case 'n':
          decoded += '\n'
          break
        case 'r':
          decoded += '\r'
          break
        case 't':
          decoded += '\t'
          break
        case 'u': {
          const hex = text.slice(i, i + 4)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw syntaxError(text, escIndex, `非法 Unicode 转义「\\u${hex}」：需要 4 位十六进制数字`)
          }
          decoded += String.fromCharCode(parseInt(hex, 16))
          i += 4
          break
        }
        default:
          throw syntaxError(text, escIndex, `非法转义「\\${esc}」：ECMA-404 仅允许 " \\ / b f n r t u`)
      }
      continue
    }
    if (ch.charCodeAt(0) < 0x20) {
      throw syntaxError(text, i, '字符串内含未转义控制字符（ECMA-404 禁止 U+0000..U+001F 裸出现）')
    }
    decoded += ch
    i += 1
  }
  throw syntaxError(text, text.length, '字符串未闭合：缺少结束双引号')
}

/**
 * 读取数字 token：ECMA-404 文法 -?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?。
 * raw 原文逐字拷贝 —— 本函数从不调用数值转换（保真核心）。
 */
function readNumeric(text: string, start: number): { token: Token; next: number } {
  let i = start
  if (text.charAt(i) === '-') i += 1
  const first = text.charAt(i)
  if (first === '0') {
    i += 1
  } else if (isDigit(first)) {
    while (i < text.length && isDigit(text.charAt(i))) i += 1
  } else {
    throw syntaxError(text, start, `非法数字：以「${first || '输入结尾'}」开头`)
  }
  if (text.charAt(i) === '.') {
    i += 1
    if (!isDigit(text.charAt(i))) throw syntaxError(text, i, '小数点后缺少数字')
    while (i < text.length && isDigit(text.charAt(i))) i += 1
  }
  const expMark = text.charAt(i)
  if (expMark === 'e' || expMark === 'E') {
    i += 1
    const sign = text.charAt(i)
    if (sign === '+' || sign === '-') i += 1
    if (!isDigit(text.charAt(i))) throw syntaxError(text, i, '指数部分缺少数字')
    while (i < text.length && isDigit(text.charAt(i))) i += 1
  }
  return { token: { type: 'number', raw: text.slice(start, i), start }, next: i }
}

/** 扫描全文产出 token 流。首字符 U+FEFF 忽略；其余位置 BOM 为非法字符（裁定边界） */
function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  if (text.charCodeAt(0) === 0xfeff) i = 1
  while (i < text.length) {
    const ch = text.charAt(i)
    if (isStructuralWhitespace(ch)) {
      i += 1
      continue
    }
    if (PUNCTUATORS.has(ch)) {
      tokens.push({ type: 'punctuation', raw: ch, start: i })
      i += 1
      continue
    }
    if (ch === '"') {
      const { token, next } = readString(text, i)
      tokens.push(token)
      i = next
      continue
    }
    if (ch === '-' || isDigit(ch)) {
      const { token, next } = readNumeric(text, i)
      tokens.push(token)
      i = next
      continue
    }
    if (text.startsWith('true', i)) {
      tokens.push({ type: 'literal', raw: 'true', start: i })
      i += 4
      continue
    }
    if (text.startsWith('false', i)) {
      tokens.push({ type: 'literal', raw: 'false', start: i })
      i += 5
      continue
    }
    if (text.startsWith('null', i)) {
      tokens.push({ type: 'literal', raw: 'null', start: i })
      i += 4
      continue
    }
    const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
    throw syntaxError(
      text,
      i,
      `非法字符「${ch}」（U+${hex}）：该位置只允许空白、结构符号、字符串、数字或 true/false/null`,
    )
  }
  return tokens
}

interface ParseCursor {
  tokens: Token[]
  text: string
  pos: number
}

function peekToken(c: ParseCursor): Token | undefined {
  return c.tokens[c.pos]
}

function expectPunctuator(c: ParseCursor, char: string, context: string): void {
  const t = peekToken(c)
  if (!t || t.type !== 'punctuation' || t.raw !== char) {
    const at = t ? t.start : c.text.length
    const actual = t ? `，实际是「${t.raw}」` : '，但输入已结束'
    throw syntaxError(c.text, at, `${context}：期望「${char}」${actual}`)
  }
  c.pos += 1
}

function parseValue(c: ParseCursor): TreeNode {
  const t = peekToken(c)
  if (!t) throw syntaxError(c.text, c.text.length, '输入为空或已结束：缺少 JSON 值')
  if (t.type === 'string') {
    c.pos += 1
    return { type: 'string', value: t.value ?? '' }
  }
  if (t.type === 'number') {
    c.pos += 1
    return { type: 'number', raw: t.raw }
  }
  if (t.type === 'literal') {
    c.pos += 1
    if (t.raw === 'true') return { type: 'boolean', value: true }
    if (t.raw === 'false') return { type: 'boolean', value: false }
    return { type: 'null' }
  }
  if (t.raw === '{') return parseObject(c)
  if (t.raw === '[') return parseArray(c)
  throw syntaxError(c.text, t.start, `意外的标记「${t.raw}」：此处应为 JSON 值`)
}

function parseObject(c: ParseCursor): TreeNode {
  expectPunctuator(c, '{', '对象')
  const properties: TreeProperty[] = []
  const after = peekToken(c)
  if (after && after.type === 'punctuation' && after.raw === '}') {
    c.pos += 1
    return { type: 'object', properties }
  }
  for (;;) {
    const keyTok = peekToken(c)
    if (!keyTok || keyTok.type !== 'string') {
      const at = keyTok ? keyTok.start : c.text.length
      const actual = keyTok ? `，实际是「${keyTok.raw}」` : '，但输入已结束'
      throw syntaxError(c.text, at, `对象的键必须是双引号字符串${actual}`)
    }
    c.pos += 1
    expectPunctuator(c, ':', `键「${keyTok.value ?? ''}」之后`)
    const value = parseValue(c)
    properties.push({ key: keyTok.value ?? '', value })
    const sep = peekToken(c)
    if (!sep) throw syntaxError(c.text, c.text.length, '对象缺少结束花括号「}」')
    if (sep.type === 'punctuation' && sep.raw === ',') {
      c.pos += 1
      const next = peekToken(c)
      // ECMA-404 禁止尾随逗号：显式报错并定位，不静默修正（prohibitions）
      if (next && next.type === 'punctuation' && next.raw === '}') {
        throw syntaxError(c.text, next.start, '对象存在尾随逗号（ECMA-404 不允许）：移除「,」或补全键值对')
      }
      continue
    }
    expectPunctuator(c, '}', '对象')
    return { type: 'object', properties }
  }
}

function parseArray(c: ParseCursor): TreeNode {
  expectPunctuator(c, '[', '数组')
  const items: TreeNode[] = []
  const after = peekToken(c)
  if (after && after.type === 'punctuation' && after.raw === ']') {
    c.pos += 1
    return { type: 'array', items }
  }
  for (;;) {
    items.push(parseValue(c))
    const sep = peekToken(c)
    if (!sep) throw syntaxError(c.text, c.text.length, '数组缺少结束方括号「]」')
    if (sep.type === 'punctuation' && sep.raw === ',') {
      c.pos += 1
      const next = peekToken(c)
      if (next && next.type === 'punctuation' && next.raw === ']') {
        throw syntaxError(c.text, next.start, '数组存在尾随逗号（ECMA-404 不允许）：移除「,」或补全元素')
      }
      continue
    }
    expectPunctuator(c, ']', '数组')
    return { type: 'array', items }
  }
}

function parseDocument(c: ParseCursor): TreeNode {
  const value = parseValue(c)
  const trailing = peekToken(c)
  if (trailing) {
    throw syntaxError(c.text, trailing.start, `顶层只允许一个 JSON 值：多余的「${trailing.raw}」`)
  }
  return value
}

/** 按缩进宽度重建文本：数字/键名/字符串逐字拷贝（raw），仅重排结构空白 */
function formatTokens(tokens: Token[], indent: number): string {
  const width = Math.max(0, Math.floor(indent))
  const pad = (depth: number): string => ' '.repeat(width * depth)
  let out = ''
  let depth = 0
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i]
    if (!t) break
    if (t.type !== 'punctuation') {
      out += t.raw
      continue
    }
    switch (t.raw) {
      case '{': {
        const closing = tokens[i + 1]
        if (closing && closing.type === 'punctuation' && closing.raw === '}') {
          out += '{}'
          i += 1
        } else {
          depth += 1
          out += `{\n${pad(depth)}`
        }
        break
      }
      case '[': {
        const closing = tokens[i + 1]
        if (closing && closing.type === 'punctuation' && closing.raw === ']') {
          out += '[]'
          i += 1
        } else {
          depth += 1
          out += `[\n${pad(depth)}`
        }
        break
      }
      case '}':
      case ']':
        depth -= 1
        out += `\n${pad(depth)}${t.raw}`
        break
      case ',':
        out += `,\n${pad(depth)}`
        break
      case ':':
        out += ': '
        break
      default:
        out += t.raw
    }
  }
  return out
}

function parseValidated(text: string): Token[] {
  const tokens = tokenize(text)
  parseDocument({ tokens, text, pos: 0 })
  return tokens
}

/**
 * 格式化：按 token 重建缩进文本（默认 2 空格）。
 * 数字与键名字符串逐字拷贝，空对象/空数组保持紧凑形态。
 * 仅接受合法 JSON（UI 先经 validateJson；非法输入抛 JsonSyntaxError）。
 */
export function formatJson(text: string, indent = 2): string {
  return formatTokens(parseValidated(text), indent)
}

/** 压缩：移除全部结构空白，字符串值内部空白原样保留 */
export function minifyJson(text: string): string {
  return parseValidated(text)
    .map((t) => t.raw)
    .join('')
}

/**
 * 校验：tokenizer + 结构解析失败即返回 ok:false 并给出行列定位（V7 不裸抛）；
 * 通过后再用 JSON.parse 交叉校验兜底（本文件唯一一处，计划明文允许——解析结果
 * 仅作布尔，绝不进入任何输出）；BOM 已被 tokenizer 忽略，交叉校验用剥离后文本对齐。
 */
export function validateJson(text: string): JsonValidateResult {
  if (typeof text !== 'string') {
    return { ok: false, error: { line: 1, column: 1, message: '输入必须是字符串' } }
  }
  try {
    parseValidated(text)
  } catch (err) {
    if (err instanceof JsonSyntaxError) {
      return { ok: false, error: { line: err.line, column: err.column, message: err.message } }
    }
    throw err
  }
  const crossCheckText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  try {
    JSON.parse(crossCheckText)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const posMatch = /position\s+(\d+)/i.exec(message)
    const at = posMatch?.[1] !== undefined ? parseInt(posMatch[1], 10) : 0
    const { line, column } = lineColumnAt(crossCheckText, at)
    return { ok: false, error: { line, column, message: `交叉语法校验失败：${message}` } }
  }
  return { ok: true, error: null }
}

/**
 * 树形视图数据源：递归 TreeNode。
 * 数字节点 raw 为原文字符串（≥2^53 零精度丢失）；重复键按原文顺序保留多个属性条目。
 * 仅接受合法 JSON（UI 先经 validateJson；非法输入抛 JsonSyntaxError）。
 */
export function buildTree(text: string): TreeNode {
  return parseDocument({ tokens: tokenize(text), text, pos: 0 })
}
