<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-20 text-center">
    <p class="font-mono text-6xl font-bold text-[var(--color-neon-cyan)]">404</p>
    <h1 class="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">页面不存在</h1>
    <p class="mt-2 text-sm text-[var(--color-text-muted)]">你访问的路径没有对应的工具或页面。</p>
    <RouterLink
      to="/"
      class="mt-8 inline-block rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-raised)]"
    >
      返回首页
    </RouterLink>
  </main>
</template>
