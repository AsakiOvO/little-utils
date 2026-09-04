import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // happy-dom 快于 jsdom（RESEARCH 假设 A4）；DOMPurify 如遇 happy-dom
      // 边缘行为，可在具体测试文件加 `// @vitest-environment jsdom` 按文件回退。
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
