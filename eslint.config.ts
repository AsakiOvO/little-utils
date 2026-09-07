import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  // 只 lint 应用代码:GSD 工作流/规划目录是仓库基础设施,不属于应用源码
  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/node_modules/**',
    '.codebuddy/**',
    '.cursor/**',
    '.claude/**',
    '.planning/**',
  ]),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // pages/layouts 目录组件按文件路由/布局惯例允许单词名(如 home.vue / tool.layout.vue)
  {
    files: ['src/pages/**/*.vue', 'src/layouts/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // Vitest 可靠性规则应用到全部测试文件（WR-03:就近 *.test.ts 布局 + 脚手架
  // __tests__ 约定双模式）。其后置的 pluginOxlint.buildFromOxlintConfigFile 块
  // 会把 oxlint 已覆盖的重叠规则置 off（委托给 lint:oxlint 原生强制），此处
  // 激活的是 oxlint 未覆盖项（如 no-identical-title、no-focused-tests 等）。
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*', 'src/**/*.test.ts'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // —— ARCH-04 全站唯一 HTML 出口卡口（Plan 01-03，T-01-01 静态封旁路）——
  // v-html 全局 error；唯一豁免是绑定变量名匹配 ^sanitized，而 sanitized* 命名只能来自
  // sanitizeHtml() 返回值（SafeHtml 组件专用）——出口被 lint + 命名双重收敛。
  // innerHTML/insertAdjacentHTML 是 code review 红线的静态化：接收者任意，故用
  // no-restricted-syntax 的 AST 选择器表达（no-restricted-properties 需固定对象名，无法覆盖任意接收者）。
  {
    rules: {
      'vue/no-v-html': ['error', { ignorePattern: '^sanitized' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message:
            '禁止直接读写 innerHTML：HTML 字符串必须经 sanitizeHtml() → SafeHtml 组件唯一出口渲染（ARCH-04）',
        },
        {
          selector: "MemberExpression[property.name='insertAdjacentHTML']",
          message:
            '禁止 insertAdjacentHTML：HTML 字符串必须经 sanitizeHtml() → SafeHtml 组件唯一出口渲染（ARCH-04）',
        },
      ],
    },
  },

  skipFormatting,
)
