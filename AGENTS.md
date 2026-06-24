# AGENTS.md

## Project Overview

Kubernetes Dashboard extension for Podman Desktop. Monitors Kubernetes clusters,
views resources (deployments, pods, services, configmaps, secrets, etc.), accesses
pod logs and terminals, and manages port forwardings. Detects kubeconfig changes
and connects to the current Kubernetes context automatically.

- **Tech stack**: TypeScript, Svelte 5, Tailwind CSS, Vite, pnpm
- **Monorepo**: pnpm workspaces with five packages — `extension`, `webview`, `channels`, `rpc`, `api`
- **Extension API**: `@podman-desktop/api`
- **Kubernetes client**: `@kubernetes/client-node`
- **DI framework**: Inversify
- **Test frameworks**: Vitest (unit), Playwright with `@podman-desktop/tests-playwright` (E2E)
- **License**: Apache-2.0

## Quick Start

```sh
pnpm install
pnpm build
```

## Essential Commands

```sh
# Build
pnpm build                    # build all packages (rpc → channels → extension + webview)

# Test
pnpm test                     # all unit tests
pnpm test:extension           # extension unit tests
pnpm test:webview             # webview unit tests
pnpm test:e2e:integration     # playwright E2E tests (with auth)

# Lint & Format
pnpm lint:check               # ESLint check
pnpm lint:fix                 # ESLint fix
pnpm format:check             # Prettier check
pnpm format:fix               # Prettier fix
pnpm typecheck                # TypeScript type checking across all packages
pnpm svelte:check             # Svelte component validation

# Pre-PR checklist (run all of these)
pnpm format:fix && pnpm lint:fix && pnpm typecheck && pnpm test
```

## Single-File Verification

Lint, type-check, and test a single file without a full build:

```sh
# Lint single file
npx eslint path/to/file.ts

# Type-check single file
npx tsc --noEmit path/to/file.ts

# Type-check by package (when cross-package imports are involved)
npx tsc --noEmit -p packages/extension/tsconfig.json
npx tsc --noEmit -p packages/webview/tsconfig.json
npx tsc --noEmit -p packages/channels/tsconfig.json
npx tsc --noEmit -p packages/rpc/tsconfig.json

# Test single file
pnpm vitest run path/to/file.spec.ts
```

## Skills

Task-specific guidance lives in `.agents/skills/`:

- `extension-development` — end-to-end feature work across extension/webview
- `backend-api` — extension backend, K8s client, Inversify DI, RPC channels
- `svelte-ui-design` — Svelte 5 and Podman Desktop UI patterns
- `unit-testing` — Vitest patterns for extension/webview/channels
- `playwright-testing` — E2E structure, envtest setup, and spec patterns
- `add-resource` — step-by-step guide and review checklist for adding a new Kubernetes resource kind

## Architecture

Webview (Svelte 5) ←→ RPC (postMessage) ←→ Extension (Node.js)

- **Extension**: `main.ts` entry, `DashboardExtension`, `@podman-desktop/api` — see **backend-api** skill
- **Webview**: `Main.svelte`, state objects, `@podman-desktop/ui-svelte` — see **svelte-ui-design** skill
- **Channels**: RPC channel definitions, API interfaces, data models (shared contract)
- **RPC**: `RpcExtension` (backend) and `RpcBrowser` (webview) transport layer
- **API**: Public extension API for other Podman Desktop extensions

Five packages under `packages/`:

- **`extension/`** — Node.js extension. Entry: `src/main.ts`, lifecycle: `src/dashboard-extension.ts`. Uses Inversify DI, `@kubernetes/client-node`.
- **`webview/`** — Svelte 5 webview UI. Entry: `src/main.ts`, root: `src/Main.svelte`. Uses Inversify DI, state objects (`.svelte.ts`).
- **`channels/`** — Shared interfaces and models. Channels: `src/channels.ts`, interfaces: `src/interface/`, models: `src/model/`.
- **`rpc/`** — RPC transport. `src/rpc.ts` provides `RpcExtension` and `RpcBrowser`.
- **`api/`** — Public API types: `src/kubernetes-dashboard-extension-api.d.ts`.

### Communication

Extension ↔ Webview via RPC over webview postMessage:

- `RpcExtension` (extension) registers `@injectable()` services for each channel
- `RpcBrowser` (webview) calls methods via `remote.getProxy(CHANNEL)`
- Broadcast channels defined in `packages/channels/src/channels.ts`

### Key Patterns

- **Inversify DI**: Services use `@injectable()`, bound in module files (`_*-module.ts`), injected via `@inject()`
- **Dispatcher**: `AbsDispatcherObjectImpl` pushes state to webview with debounce/throttle
- **StateObject**: `AbsStateObjectImpl` (`.svelte.ts`) manages reactive state in webview
- **Resource factories**: Each K8s resource type has a factory in `packages/extension/src/resources/`

### Extension Registration

Extension points (commands, menus, configuration, icons, views) are defined in
`packages/extension/package.json` under `contributes`.

## Pattern References

- New RPC channel: follow `packages/channels/src/channels.ts` (definition), `packages/channels/src/interface/` (interface)
- New backend service: follow `packages/extension/src/manager/contexts-manager.ts` (implementation), `packages/extension/src/manager/_manager-module.ts` (binding)
- New dispatcher: follow `packages/extension/src/dispatcher/update-resource-dispatcher.ts`
- New state object: follow `packages/webview/src/state/available-contexts.svelte.ts`
- New Svelte page/component: follow `packages/webview/src/component/apply/KubeApplyYAML.svelte`
- New unit test (extension): follow `packages/extension/src/dashboard-extension.spec.ts`
- New unit test (webview): follow `packages/webview/src/App.spec.ts`
- New E2E test: follow `tests/playwright/src/extension.spec.ts`
- New resource factory: follow `packages/extension/src/resources/pods-resource-factory.ts`

## Coding Guidelines

### Svelte Patterns

This project uses **Svelte 5 runes** (`$state`, `$derived`, `$effect`). Do NOT use legacy reactive syntax (`$:`, `let x = writable()`). For concrete component and state patterns, use `.agents/skills/svelte-ui-design/SKILL.md`.

### Testing Patterns

Use `.agents/skills/unit-testing/SKILL.md` for unit-test patterns and `.agents/skills/playwright-testing/SKILL.md` for E2E patterns. Extension tests mock `@podman-desktop/api` and `@kubernetes/client-node`, webview tests use `@testing-library/svelte` with `FakeStateObject`. Import alias: `/@/` → `src/`.

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add CronJob resource view
feat(pods): add more information to pod page
fix: handle missing kubeconfig gracefully
chore: bump eslint-plugin-unicorn
docs: update README with E2E instructions
```

### Import Organization

Use **simple-import-sort** plugin ordering:

1. External dependencies
2. Internal packages (`@kubernetes-dashboard/*`)
3. Podman Desktop packages (`@podman-desktop/*`)
4. Relative imports

Import alias: `/@/` → package `src/` directory.

## License

Apache 2.0 — include license header in new files:

```typescript
/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
```

Update headers for modified files with the current year:

```typescript
/**********************************************************************
 * Copyright (C) 2024 - 2026 Red Hat, Inc.
[...]
```
