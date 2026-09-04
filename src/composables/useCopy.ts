// src/composables/useCopy.ts — 全站复制基建（成功标准 #4，RESEARCH Code Examples）
// Don't Hand-Roll：禁止裸调 navigator.clipboard——useClipboard({ legacy: true })
// 提供安全上下文缺失时的 document.execCommand('copy') 降级路径。
import { useClipboard } from '@vueuse/core'

export function useCopy() {
  const { copy, copied, isSupported } = useClipboard({ legacy: true, copiedDuring: 1500 })
  return { copy, copied, isSupported }
}
