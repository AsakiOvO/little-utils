<!-- 404 页:D-15 Typography 归一(404 weight 600、h1 Heading 20px/600);返回首页 44px 触控(D-21)+ hover accent 对齐 Button outline 语言 -->
<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-20 text-center">
    <p class="font-mono text-6xl font-semibold text-[var(--color-neon-cyan)]">404</p>
    <h1 class="mt-4 text-[20px] font-semibold text-[var(--color-text-primary)]">页面不存在</h1>
    <p class="mt-2 text-sm text-[var(--color-text-muted)]">你访问的路径没有对应的工具或页面。</p>
    <!-- Button 无链接形态,保留 RouterLink 语义导航 + Button outline 样式语言;min-h-11 触控目标(D-21),
         去 font-medium(weights 全站仅 400/600);inline-flex + justify-center 使 min-h-11 下文字垂直居中 -->
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center justify-center min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]"
    >
      返回首页
    </RouterLink>
  </main>
</template>
