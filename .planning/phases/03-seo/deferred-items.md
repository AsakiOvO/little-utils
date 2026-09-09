# Deferred Items — Phase 03

## 03-03 部署管线收尾挂起项(2026-09-09)

| 项 | 位置 | 说明 | 处置 |
|----|------|------|------|
| D-04 sitemap 提交（Google Search Console + 百度站长平台） | 平台控制台（浏览器人工操作） | Task 3 终局验收 checkpoint 上用户明确决定 **SKIP** 两处提交。前置条件已满足（SITE_URL = 终态生产域名 https://little-utils.pages.dev，占位域名计数 = 0，sitemap.xml/robots.txt 公网可达且 curl 验收绿），提交动作可随时重做且不违反 Pitfall 2 顺序约束 | 挂起，随时可执行；提交 URL = https://little-utils.pages.dev/sitemap.xml |
| D-20 大陆无代理实测 | 大陆网络环境（无代理打开首页与任一工具页，D-19） | 按 plan 03-03 D-20 拆分口径显式挂起：本阶段验收 = 部署管线 + 全球域名 curl 可达（已绿）；大陆实测属 SC-3 拆分项，非静默丢弃 | 挂起；执行条件 = 自定义域名绑定后执行，不阻塞本阶段完成 |
