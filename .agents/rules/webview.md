---
paths:
  - 'packages/webview/**/*.svelte'
  - 'packages/webview/**/*.ts'
---

Use Svelte 5 runes ($state, $derived, $effect). Never use legacy $: reactive syntax or writable() stores. State classes use .svelte.ts extension.

Frontend tests use @testing-library/svelte with vitest. Access backend via remote.getProxy(CHANNEL). Import alias: /@/ -> src/.
