---
paths:
  - 'packages/channels/**/*.ts'
---

Channels package defines RPC channel interfaces, data models, and types shared between extension and webview. Changes here affect both sides.

Channel interfaces are the RPC contract. Keep channel definitions in channels.ts in sync with implementations in the extension package.
