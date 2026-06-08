---
name: backend-api
description: >-
  Guides backend development with @podman-desktop/api, @kubernetes/client-node,
  and the Kubernetes Dashboard extension's RPC and Inversify DI system. Covers
  Kubernetes resource management, dispatchers, subscribers, port forwarding,
  and pod streaming. Triggers when working on packages/extension/ code, adding
  RPC methods, implementing Kubernetes operations, or asking about backend
  patterns.
paths:
  - packages/extension/src/**/*.ts
  - packages/channels/src/**/*.ts
---

# Backend API Development Guide

## Extension API: @podman-desktop/api

The extension runs as a Podman Desktop extension in Node.js. Host interactions
go through `@podman-desktop/api` (external dependency, not bundled).

Discover available APIs by reading type definitions:

```sh
find node_modules/@podman-desktop/api -name '*.d.ts' | head -5
```

## Kubernetes Client: @kubernetes/client-node

Key classes:

- `KubeConfig` — load from file, manage contexts
- `Watch` — stream Kubernetes object changes
- `KubernetesObjectApi` — direct object operations (CRUD)
- `loadAllYaml` — parse YAML documents

Kubeconfig lifecycle in `dashboard-extension.ts`:

```typescript
const kubeconfig = kubernetes.getKubeconfig();
const kubeConfig = new KubeConfig();
kubeConfig.loadFromFile(event.location.path);
await this.#contextsManager.update(kubeConfig);

// Watch for kubeconfig changes
kubernetes.onDidUpdateKubeconfig(this.onKubeconfigUpdate.bind(this));
```

## Inversify DI

All services use `@injectable()` and are bound in module files.

### Creating a New Service

1. Define the interface in `packages/channels/src/interface/`
2. Create the implementation:

```typescript
@injectable()
export class MyServiceImpl implements MyServiceApi {
  @inject(ContextsManager) private manager: ContextsManager;

  async myMethod(arg: string): Promise<Result> {
    // implementation
  }
}
```

3. Bind in the appropriate module (`packages/extension/src/manager/_manager-module.ts`):

```typescript
options.bind<MyServiceImpl>(MyServiceImpl).toSelf().inSingletonScope();
```

4. If the service needs cleanup, also bind as IDisposable:

```typescript
options.bind(IDisposable).toService(MyServiceImpl);
```

### DI Module Organization

- `manager/_manager-module.ts` — Core managers and API implementations
- `dispatcher/_dispatcher-module.ts` — State dispatchers
- `port-forward/_port-forward-module.ts` — Port forwarding
- `subscriber/_subscriber_modules.ts` — Channel subscribers

### Symbols

```typescript
// packages/extension/src/inject/symbol.ts
export const ExtensionContextSymbol = Symbol.for('ExtensionContext');
export const TelemetryLoggerSymbol = Symbol.for('TelemetryLogger');
```

## Dispatcher Pattern (State Broadcasting)

Dispatchers push state from extension to webview via RPC broadcasts.

Base class: `AbsDispatcherObjectImpl<T, U>` in `dispatcher/util/dispatcher-object.ts`

- Debounce: 100ms — prevents rapid-fire updates
- Throttle: 200ms — guarantees minimum update interval

### Creating a New Dispatcher

```typescript
@injectable()
export class MyDispatcher extends AbsDispatcherObjectImpl<MyOptions, MyInfo> {
  constructor(@inject(ContextsManager) private manager: ContextsManager) {
    super(MY_CHANNEL);
  }

  getData(options: MyOptions): MyInfo {
    return { items: this.manager.getMyData(options) };
  }
}
```

Bind in `dispatcher/_dispatcher-module.ts`:

```typescript
options.bind<MyDispatcher>(MyDispatcher).toSelf().inSingletonScope();
options.bind(DispatcherObject).toService(MyDispatcher);
```

## Subscriber Pattern

`ChannelSubscriber` (`subscriber/channel-subscriber.ts`) tracks which webview
subscribers need data for each channel. Used by `ContextsStatesDispatcher` to
dispatch updates only to active subscribers.

## Resource Factories

Each Kubernetes resource type has a factory in `resources/`:

- `pods-resource-factory.ts`, `deployments-resource-factory.ts`, etc.

Factories implement `ResourceInformerFactory` and `ResourcePermissionsFactory`:

```typescript
export interface ResourceInformerFactory {
  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<KubernetesObject>;
}
```

### Adding a New Kubernetes Resource

1. Create `my-resource-factory.ts` in `packages/extension/src/resources/`
2. Implement `ResourceInformerFactory` and `ResourcePermissionsFactory`
3. Register in `ResourceFactoryHandler`
4. Add channel + dispatcher for the resource data
5. Add state object in webview

## Checklist for New Backend Features

- [ ] Channel interface defined in `packages/channels/src/interface/`
- [ ] Data models in `packages/channels/src/model/` if needed
- [ ] RPC channel created in `packages/channels/src/channels.ts`
- [ ] `@injectable()` implementation in `packages/extension/src/`
- [ ] Bound in appropriate DI module
- [ ] Registered with RPC in `dashboard-extension.ts`
- [ ] Unit tests with mocked `@podman-desktop/api`
