---
name: extension-development
description: >-
  Guides end-to-end feature development in the Kubernetes Dashboard Podman
  Desktop extension. Covers the extension lifecycle, 5-package architecture,
  RPC communication, Inversify DI, build system, and extension points. Triggers
  when adding features spanning extension and webview, understanding the
  extension lifecycle, or needing an architectural overview.
---

# Kubernetes Dashboard Extension Development Guide

## Extension Lifecycle

### Entry Point (`packages/extension/src/main.ts`)

`activate()` creates a `DashboardExtension` and returns a
`KubernetesDashboardExtensionApi`. `deactivate()` cleans up.

### Activation Sequence (`packages/extension/src/dashboard-extension.ts`)

1. Create webview panel (loads `media/index.html`)
2. Initialize RPC (`new RpcExtension(panel.webview)` + `rpcExtension.init()`)
3. Setup Inversify DI container (`InversifyBinding.initBindings()`)
4. Load all managers, dispatchers, subscribers from container
5. Register RPC instances for each channel (API_CONTEXTS, API_SUBSCRIBE, etc.)
6. Start kubeconfig watcher, health checks, port forwarding
7. Return extension API for external consumers

## 5-Package Architecture

```
Extension (Node.js) <--RPC--> Channels (shared interfaces) <--RPC--> Webview (Svelte 5)
                                     |
                                RPC (transport)
                                     |
                                API (external)
```

- **`packages/extension/`** — Node.js backend. Entry: `src/main.ts`. Uses
  `@podman-desktop/api`, `@kubernetes/client-node`, Inversify DI.
- **`packages/webview/`** — Svelte 5 UI. Entry: `src/main.ts`, root: `src/Main.svelte`.
  Uses `@podman-desktop/ui-svelte`, Inversify DI, RpcBrowser.
- **`packages/channels/`** — Shared RPC channel definitions, API interfaces, and
  data models. The contract between extension and webview.
- **`packages/rpc/`** — Transport layer. `RpcExtension` (backend) and `RpcBrowser`
  (webview) over webview postMessage.
- **`packages/api/`** — Public API for other Podman Desktop extensions.

### Build Order

RPC and Channels must build first (they are dependencies):

```sh
pnpm build:rpc && pnpm build:channels && pnpm build
```

## Adding a New Feature (End-to-End)

1. **Define the channel interface** in `packages/channels/src/interface/`. Create
   or extend an API interface (e.g., `MyFeatureApi`).
2. **Define data models** in `packages/channels/src/model/` if needed.
3. **Create the RPC channel** in `packages/channels/src/channels.ts`:
   ```typescript
   export const API_MY_FEATURE = createRpcChannel<MyFeatureApi>('MyFeatureApi');
   ```
4. **Implement the backend** in `packages/extension/src/`:
   - Create `@injectable()` service implementing the interface
   - Bind in the appropriate DI module (`_manager-module.ts`)
   - Register with RPC in `dashboard-extension.ts`:
     ```typescript
     rpcExtension.registerInstance(API_MY_FEATURE, container.get(MyFeatureApiImpl));
     ```
5. **Build the webview UI** in `packages/webview/src/`:
   - Access via `remote.getProxy(API_MY_FEATURE)`
   - For state broadcasting, create a StateObject + DispatcherObject pair
6. **Write tests** — unit tests for both extension and webview, update E2E if needed.

## RPC Communication

### Request-Response (webview calls extension)

```typescript
// Webview: get proxy, call methods
const myApi = remote.getProxy(API_MY_FEATURE);
const result = await myApi.doSomething(args);
```

### Broadcasting (extension pushes to webview)

```typescript
// Extension: fire broadcast
rpcExtension.fire(MY_CHANNEL, data);

// Webview: listen for broadcasts
const disposable = rpcBrowser.on(MY_CHANNEL, data => { /* handle */ });
```

### Timeout

Default 5 seconds. For long-running operations:

```typescript
const proxy = remote.getProxy(API_MY_FEATURE, {
  noTimeoutMethods: ['longRunningMethod'],
});
```

## Extension Points

Extension points (commands, menus, configuration, icons, views) are defined in
`packages/extension/package.json` under `contributes`.

## Development Watch Mode

```sh
cd packages/webview && pnpm watch    # Rebuilds webview on changes
```

The extension is rebuilt by Podman Desktop when webview output changes.
