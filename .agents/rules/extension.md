---
paths:
  - 'packages/extension/**/*.ts'
---

Extension runs in Node.js with Inversify DI. Mock @podman-desktop/api in tests. Uses @kubernetes/client-node for K8s API access.

New RPC methods require: channel interface in packages/channels, backend implementation as @injectable() service, webview proxy via remote.getProxy().
