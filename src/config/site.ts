// src/config/site.ts — 站点 URL 唯一定义点（D-11/D-12）
// 四消费方单源（D-12）：canonical、og:url、sitemap 全部 URL、robots.txt Sitemap 行
// 统一 import 此处，禁止在任何组件/页面/脚本散落硬编码域名。
// 占位值待首次部署后按 D-11 修正（读取 EdgeOne 实际分配域名后回填并重跑构建）。
// 文件必须 Node 安全：纯常量、零 import、零浏览器 API——构建脚本（check-dist/vite onFinished）
// 与组件层共用；注释纪律照 useThemeMode.ts THEME_STORAGE_KEY 的唯一定义点先例。
export const SITE_URL = 'https://little-utils.edgeone.app'
