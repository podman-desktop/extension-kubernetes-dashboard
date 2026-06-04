---
name: unit-testing
description: >-
  Guides writing and maintaining Vitest unit tests for the Kubernetes Dashboard
  extension's backend, webview, and channels packages. Covers mocking
  @podman-desktop/api, @kubernetes/client-node, Inversify DI, RPC clients,
  Svelte components, and state objects. Triggers when creating or modifying
  .spec.ts files, fixing Vitest failures, or adding test coverage.
paths:
  - packages/extension/src/**/*.spec.ts
  - packages/webview/src/**/*.spec.ts
  - packages/channels/src/**/*.spec.ts
argument-hint: '[test-file-or-pattern]'
---

# Unit Testing for Kubernetes Dashboard Extension

## Framework

- **Vitest 4** with v8 coverage provider
- **Extension**: Node.js environment, mocked `@podman-desktop/api`
- **Webview**: jsdom environment, `@testing-library/svelte`
- **Channels**: Node.js environment

## Running Tests

```sh
pnpm test                          # all unit tests
pnpm test:extension                # extension tests only
pnpm test:webview                  # webview tests only
pnpm vitest run path/to/file.spec.ts  # single file
pnpm vitest --watch                # watch mode
```

## Extension Test Patterns

### Mocking @podman-desktop/api

The mock lives at `__mocks__/@podman-desktop/api.js` and is aliased in
`packages/extension/vitest.config.ts`:

```typescript
alias: {
  '@podman-desktop/api': resolve(WORKSPACE_ROOT, '__mocks__/@podman-desktop/api.js'),
  '/@/': join(PACKAGE_ROOT, 'src') + '/',
}
```

### Mocking @kubernetes/client-node

```typescript
vi.mock(import('@kubernetes/client-node'));

const kubeConfig = new KubeConfig();
kubeConfig.loadFromFile = vi.fn();
```

### Mocking Node.js Modules

```typescript
import { vol } from 'memfs';

vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    '/path/to/file': 'content',
  });
});
```

### Testing DI Services

Mock dependencies and test the implementation directly:

```typescript
beforeEach(() => {
  vi.restoreAllMocks();
  ContextsManager.prototype.update = vi.fn();
  ContextsStatesDispatcher.prototype.init = vi.fn();
});

test('should activate correctly', async () => {
  await dashboardExtension.activate();
  expect(ContextsManager.prototype.update).toHaveBeenCalledOnce();
});
```

## Webview Test Patterns

### Rendering Svelte Components

```typescript
import { render } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

test('renders correctly', () => {
  const { getByText } = render(MyComponent, { props: { name: 'test' } });
  expect(getByText('test')).toBeDefined();
});
```

### Mocking State Objects

Use `FakeStateObject` for testing components that depend on state:

```typescript
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';

const myStateMock = new FakeStateObject();
myStateMock.setData({ items: [] });

beforeEach(() => {
  statesMocks.mock<MyInfo, void>('stateMyInfoUI', myStateMock);
});
```

### Using Fake Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

test('debounced update', async () => {
  render(MyComponent);
  await vi.advanceTimersByTimeAsync(600);
  expect(/* assertion */);
});

afterEach(() => {
  vi.useRealTimers();
});
```

### Mocking Svelte Components

```typescript
vi.mock(import('/@/component/MyChild.svelte'));
```

## Test File Structure

```typescript
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock(/* dependencies */);

let sut: MyClass;

beforeEach(() => {
  vi.restoreAllMocks();
  sut = new MyClass(/* mocked deps */);
});

describe('myMethod', () => {
  test('should handle normal case', async () => {
    const result = await sut.myMethod('input');
    expect(result).toEqual(expected);
  });

  test('should handle error case', async () => {
    await expect(sut.myMethod('bad')).rejects.toThrow('error message');
  });
});
```

## Vitest Configuration

Each package has its own `vitest.config.ts`. Key settings:

- **globals: true** — no need to import `describe`, `test`, `expect`
- **alias** — `/@/` maps to package `src/`, `@podman-desktop/api` maps to mock
- **environment** — `node` for extension, `jsdom` for webview
