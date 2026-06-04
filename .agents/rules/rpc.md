---
paths:
  - 'packages/rpc/**/*.ts'
---

RPC package provides RpcExtension (backend) and RpcBrowser (webview) for bidirectional communication over webview postMessage.

Default timeout is 5 seconds. Use noTimeoutMethods option for long-running operations. Must stay compatible with channel interfaces.
