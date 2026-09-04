// JSON tokenizer 服务测试（TOOL-01）—— TDD RED 先行（Plan 01-04 Task 1）
// 六组用例：2^53 保真 / 往返无损属性 / 键序与重复键 / 压缩 / 校验与行列定位 / BOM 容错。
// 断言锚点：'9052710354240385291'（电商订单/雪花 ID 场景）必须逐字保留，全程不经 JS number 中转。
import { describe, expect, it } from 'vitest'
import {
  buildTree,
  formatJson,
  minifyJson,
  validateJson,
  type TreeNode,
} from './json-formatter.service'

/** U+FEFF（BOM）——用字符码构造，避免源码中出现不可见字符 */
const BOM: string = String.fromCharCode(0xfeff)

/** 类型收窄助手：断言节点为对象节点 */
function asObject(tree: TreeNode): Extract<TreeNode, { type: 'object' }> {
  if (tree.type !== 'object') throw new Error(`expected object node, got ${tree.type}`)
  return tree
}

/**
 * 测试侧规范化器（黑盒对拍）：移除字符串字面量之外的全部结构空白。
 * 与 tokenizer 的 token 序列视角等价 —— 两侧规范化结果相等 ⇔ 忽略空白后逐 token 相等。
 */
function stripStructuralWhitespace(text: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i)
    if (inString) {
      out += ch
      if (ch === '\\') {
        out += text.charAt(i + 1)
        i += 1
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
      continue
    }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue
    out += ch
  }
  return out
}

/** 生成 depth 层嵌套对象：{"l1":{"l2":...{"lN":1}...}} */
function nestedObject(depth: number): string {
  let inner = '1'
  for (let d = depth; d >= 1; d -= 1) {
    inner = `{"l${d}":${inner}}`
  }
  return inner
}

const ROUND_TRIP_SAMPLES: Array<[string, string]> = [
  ['深层嵌套 ≥10 层对象', nestedObject(10)],
  ['1000 元素长数组', `[${Array.from({ length: 1000 }, (_, i) => i).join(',')}]`],
  ['重复键', '{"a":1,"a":2,"b":3}'],
  ['emoji 与中文键', '{"🎉":"庆祝","中文键":"值","en":true}'],
  ['转义序列（\\uXXXX、\\t、\\/、\\"）', '{"\\u0041":"\\u0041x","tab":"a\\tb","slash":"a\\/b","quote":"say \\"hi\\""}'],
  ['空对象/空数组/三种字面量', '{"emptyObj":{},"emptyArr":[],"t":true,"f":false,"n":null}'],
  ['超长整数/负小数/科学计数', '{"big":123456789012345678901234567890,"neg":-0.5,"exp":1e-7}'],
]

describe('2^53 数字保真（TOOL-01 核心）', () => {
  it('formatJson 原文保留长 ID 数字', () => {
    const formatted = formatJson('{"orderId":9052710354240385291}')
    expect(formatted).toContain('9052710354240385291')
  })

  it('buildTree 数字节点 raw 为原文字符串（string 形态，非 number 类型）', () => {
    const tree = asObject(buildTree('{"orderId":9052710354240385291}'))
    const prop = tree.properties[0]
    expect(prop?.key).toBe('orderId')
    expect(prop?.value).toEqual({ type: 'number', raw: '9052710354240385291' })
    expect(typeof (prop?.value as { raw?: unknown }).raw).toBe('string')
  })

  it('负数与指数原文保留', () => {
    const text = '{"n":-9007199254740993,"e":1.5e300}'
    const formatted = formatJson(text)
    expect(formatted).toContain('-9007199254740993')
    expect(formatted).toContain('1.5e300')
    const tree = asObject(buildTree(text))
    expect(tree.properties[0]?.value).toEqual({ type: 'number', raw: '-9007199254740993' })
    expect(tree.properties[1]?.value).toEqual({ type: 'number', raw: '1.5e300' })
  })

  it('超长整数（远超 2^53）逐字保留', () => {
    const tree = asObject(buildTree('{"big":123456789012345678901234567890}'))
    expect(tree.properties[0]?.value).toEqual({
      type: 'number',
      raw: '123456789012345678901234567890',
    })
  })
})

describe('往返无损属性（忽略空白后逐 token 序列相等）', () => {
  it.each(ROUND_TRIP_SAMPLES)('%s：formatJson 往返 + minify 等价 + 校验通过', (_label, sample) => {
    const normalized = stripStructuralWhitespace(sample)
    expect(stripStructuralWhitespace(formatJson(sample, 2))).toBe(normalized)
    expect(minifyJson(sample)).toBe(normalized)
    expect(validateJson(sample)).toEqual({ ok: true, error: null })
  })

  it.each(ROUND_TRIP_SAMPLES)('%s：格式化幂等（format∘format = format）', (_label, sample) => {
    expect(formatJson(formatJson(sample, 2), 2)).toBe(formatJson(sample, 2))
  })

  it('转义序列解码正确（\\u0041 → A；原始转义文本不被改写）', () => {
    const tree = asObject(buildTree('{"\\u0041":"\\u0041x","tab":"a\\tb"}'))
    expect(tree.properties[0]?.key).toBe('A')
    expect(tree.properties[0]?.value).toEqual({ type: 'string', value: 'Ax' })
    expect(tree.properties[1]?.value).toEqual({ type: 'string', value: 'a\tb' })
  })

  it('缩进重建为 2 空格标准形态', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatJson('[]')).toBe('[]')
    expect(formatJson('{}')).toBe('{}')
    expect(formatJson('[[1,2],[3]]')).toBe(
      '[\n  [\n    1,\n    2\n  ],\n  [\n    3\n  ]\n]',
    )
  })
})

describe('键序与重复键（不重排、不合并）', () => {
  it('formatJson 按原文顺序保留重复键', () => {
    const formatted = formatJson('{"a":1,"a":2,"b":3}')
    const i1 = formatted.indexOf('"a": 1')
    const i2 = formatted.indexOf('"a": 2')
    const i3 = formatted.indexOf('"b": 3')
    expect(i1).toBeGreaterThanOrEqual(0)
    expect(i2).toBeGreaterThan(i1)
    expect(i3).toBeGreaterThan(i2)
  })

  it('buildTree 按原文顺序保留重复键', () => {
    const tree = asObject(buildTree('{"a":1,"a":2,"b":3}'))
    expect(tree.properties.map((p) => p.key)).toEqual(['a', 'a', 'b'])
    expect(tree.properties.map((p) => p.value)).toEqual([
      { type: 'number', raw: '1' },
      { type: 'number', raw: '2' },
      { type: 'number', raw: '3' },
    ])
  })
})

describe('压缩', () => {
  it('移除全部结构空白但保留字符串值内部空白', () => {
    expect(minifyJson('{"a": "x y", "b":[1, 2]}')).toBe('{"a":"x y","b":[1,2]}')
  })
})

describe('校验与错误定位', () => {
  it('尾随逗号：ok:false + line/column 定位', () => {
    const result = validateJson('{"a":1,}')
    expect(result.ok).toBe(false)
    expect(result.error).not.toBeNull()
    expect(result.error?.line).toBe(1)
    expect(result.error?.column).toBeGreaterThan(0)
    expect(result.error?.message).not.toBe('')
  })

  it('未闭合字符串：ok:false + 非空消息 + 行列', () => {
    const result = validateJson('"unterminated')
    expect(result.ok).toBe(false)
    expect(result.error?.message.length).toBeGreaterThan(0)
    expect(result.error?.line).toBeGreaterThanOrEqual(1)
    expect(result.error?.column).toBeGreaterThan(0)
  })

  it('空/纯空白输入：结构化错误，不崩溃（ARCH-01/empty 同源边界）', () => {
    expect(validateJson('').ok).toBe(false)
    const ws = validateJson('  ')
    expect(ws.ok).toBe(false)
    expect(ws.error?.message.length).toBeGreaterThan(0)
    expect(ws.error?.line).toBeGreaterThanOrEqual(1)
    expect(ws.error?.column).toBeGreaterThan(0)
  })

  it('合法输入 ok:true 且 error 为 null', () => {
    expect(validateJson('{"ok":true}')).toEqual({ ok: true, error: null })
  })
})

describe('BOM 容错', () => {
  it('首字符 U+FEFF 被忽略，其余内容正常解析', () => {
    expect(validateJson(BOM + '{"a":1}').ok).toBe(true)
    expect(formatJson(BOM + '{"a":1}')).toBe('{\n  "a": 1\n}')
  })

  it('字符串内部 U+FEFF 为普通字符串内容', () => {
    const result = validateJson('{"a":"x' + BOM + 'y"}')
    expect(result.ok).toBe(true)
    const tree = asObject(buildTree('{"a":"x' + BOM + 'y"}'))
    expect(tree.properties[0]?.value).toEqual({ type: 'string', value: 'x' + BOM + 'y' })
  })

  it('BOM 出现在非首字符的结构位置按 ECMA-404 报错（flagged assumption 裁定）', () => {
    expect(validateJson('{"a":1}' + BOM).ok).toBe(false)
    expect(validateJson(' ' + BOM + '{"a":1}').ok).toBe(false)
  })
})
