<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
      little-utils
    </h1>
    <p class="mt-2 text-[var(--color-text-muted)]">
      开发者 &amp; 办公工具箱 — 所有计算均在浏览器本地完成,数据不出浏览器。
    </p>

    <!-- 空注册表空态（ARCH-01/empty 假设的 UI 侧体现：空态而非白屏） -->
    <div
      class="mt-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center"
    >
      <p class="text-lg font-medium text-[var(--color-text-primary)]">工具正在准备上线</p>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">
        工具注册表尚未收录任何工具,敬请期待。
      </p>
    </div>
  </main>
</template>
