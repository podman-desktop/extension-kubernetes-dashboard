---
name: svelte-ui-design
description: >-
  Guides designing and building Svelte 5 UI components in the Kubernetes
  Dashboard extension. Covers @podman-desktop/ui-svelte components, Tailwind
  CSS, Svelte 5 runes, state management, routing, tables, and component
  patterns. Triggers when creating or modifying Svelte components, building UI
  pages, working with the component library, or asking about frontend patterns.
paths:
  - packages/webview/src/**/*.svelte
  - packages/webview/src/**/*.ts
  - packages/webview/src/**/*.css
---

# Svelte UI Design Guide

## Component Library Priority

**Always use `@podman-desktop/ui-svelte` first.** This library provides
Podman Desktop's design system. Only create custom components when the library
doesn't offer what you need.

Discover available components:

```sh
ls node_modules/@podman-desktop/ui-svelte/dist/**/*.svelte
```

Common components: `Button`, `Dropdown`, `Input`, `FormPage`, `ErrorMessage`,
`Tab`, `Table`, `EmptyScreen`, `StatusIcon`, `Link`.

Storybook reference: https://podman-desktop.io/storybook

## Svelte 5 Runes

This project uses **Svelte 5 runes**. Never use legacy reactive syntax.

```svelte
<script lang="ts">
// State
let count = $state(0);
let items = $state<Item[]>([]);

// Derived
let total = $derived(items.length);
let filtered = $derived(items.filter(i => i.active));

// Effects
$effect(() => {
  console.log('count changed:', count);
});
</script>
```

**Never use:** `$:`, `writable()`, `readable()`, `derived()` from `svelte/store`.

## State Management

State objects use `.svelte.ts` extension and the `StateObject` pattern:

```typescript
// packages/webview/src/state/my-state.svelte.ts
@injectable()
export class StateMyInfo extends AbsStateObjectImpl<MyInfo, void> {
  constructor(@inject(RpcBrowser) rpcBrowser: RpcBrowser) {
    super(rpcBrowser);
  }
  async init(): Promise<void> {
    await this.initChannel(MY_CHANNEL);
  }
}
```

Access state in components via `States`:

```svelte
<script lang="ts">
const states = getContext<States>(States);
const myState = states.stateMyInfoUI;
let data = $derived(myState.data);

onMount(() => {
  const unsub = myState.subscribe();
  return unsub;
});
</script>
```

All states are collected in `packages/webview/src/state/states.ts`.

## Remote API Access

Call backend methods via RPC proxy:

```svelte
<script lang="ts">
const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

async function handleAction(): Promise<void> {
  await contextsApi.setCurrentContext(contextName);
}
</script>
```

For broadcast listening:

```svelte
<script lang="ts">
const rpcBrowser = getContext<RpcBrowser>(RpcBrowser);

onMount(() => {
  const disposable = rpcBrowser.on(MY_CHANNEL, data => {
    // handle broadcast
  });
  return () => disposable.dispose();
});
</script>
```

## Routing

The app uses hash-based routing with a custom `Route` component
(`packages/webview/src/Route.svelte`).

Main routing structure:

- `Main.svelte` — initializes app, waits for context
- `App.svelte` — checks for current K8s context
- `AppWithContext.svelte` — renders navigation + routed content

## Component Patterns

### Page Layout

```svelte
<FormPage title="My Page" description="Page description">
  <!-- content -->
</FormPage>
```

### Resource Tables

Resource list views follow a standard pattern with table components
in `packages/webview/src/table/`.

### Props Pattern

```svelte
<script lang="ts">
interface Props {
  resourceName: string;
  namespace?: string;
}
let { resourceName, namespace }: Props = $props();
</script>
```

## Styling

Use **Tailwind CSS** classes. The theme comes from `@podman-desktop/ui-svelte`.

```svelte
<div class="flex flex-col w-full h-full gap-2 p-4">
  <span class="text-[var(--pd-content-text)]">{label}</span>
</div>
```

## DI in Webview

The webview has its own Inversify container (`packages/webview/src/inject/inversify-binding.ts`):

```typescript
container.bind(RpcBrowser).toConstantValue(rpcBrowser);
container.bind(Remote).toConstantValue(rpcBrowser);
await container.load(statesModule);
await container.load(streamsModule);
```

Context is provided to Svelte components via Svelte `setContext`/`getContext`.
