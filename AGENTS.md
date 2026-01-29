# AGENTS.md

This file provides guidance for AI agents working on the Kubernetes Dashboard Podman Desktop Extension codebase.

## Project Overview

This is a **monorepo** for a Podman Desktop extension that provides a Kubernetes Dashboard UI. The extension allows users to monitor and interact with Kubernetes clusters, view resources, access pod logs, open terminals, and manage port forwardings.

## Architecture

### Monorepo Structure

The project uses **pnpm workspaces** with the following packages:

- **`packages/api`**: API to share features with other Podman Desktop extensions
- **`packages/channels`**: Channel abstractions for communication patterns
- **`packages/extension`**: The main extension code that runs in Podman Desktop (Node.js/TypeScript)
- **`packages/rpc`**: RPC communication layer between extension and webview
- **`packages/webview`**: The Svelte-based UI that runs in a webview (Svelte 5 + TypeScript)
- **`tests/playwright`**: End-to-end tests using Playwright

### Communication Flow

- Extension ↔ Webview: Uses RPC channels for bidirectional communication
- Extension ↔ Kubernetes API: Uses `@kubernetes/client-node`
- Webview ↔ Extension: All operations go through RPC channels

## Key Technologies

- **TypeScript 5**: Strict type checking enabled
- **Svelte 5**: Modern reactive framework (runes-based)
- **Vite 7**: Build tool and dev server
- **pnpm**: Package manager
- **Node.js >=24.0.0**: Runtime requirement
- **Vitest**: Unit testing framework
- **Playwright**: E2E testing
- **Inversify**: Dependency injection container
- **Svelte Components**: via `@podman-desktop/ui-svelte`
- **Tailwind CSS**: Styling (via `@podman-desktop/ui-svelte`)

## Coding Standards

### TypeScript

- Use **strict TypeScript** (`@tsconfig/strictest`)
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Avoid `null` - use `undefined` instead (enforced by `eslint-plugin-no-null`)
- Avoid redundant `undefined` in optional properties (enforced by `eslint-plugin-redundant-undefined`)

### Svelte

- Use **Svelte 5 runes** (`$state`, `$derived`, `$effect`, etc.)
- Prefer runes over legacy reactive statements
- Keep components focused and composable
- Use TypeScript for component logic

### File Organization

- Source files in `src/` directories
- Tests co-located
- Use clear, descriptive file names
- Group related functionality together

### Imports

- Use **simple-import-sort** plugin ordering:
  1. External dependencies
  2. Internal packages (`@kubernetes-dashboard/*`)
  3. Podman Desktop packages (`@podman-desktop/*`)
  4. Relative imports
- Prefer named exports over default exports
- Use absolute imports with aliases when configured (e.g., `/@/`)

### Error Handling

- Always handle errors explicitly
- Use proper error types
- Log errors appropriately
- Provide meaningful error messages

## Development Workflow

### Setup

```bash
pnpm i                    # Install dependencies
cd packages/webview
pnpm watch               # Watch mode for webview (keep running)
```

### Build Commands

- `pnpm build`: Build all packages
- `pnpm watch`: Watch mode for webview and extension
- `pnpm format:check`: Check code formatting
- `pnpm format:fix`: Auto-fix formatting
- `pnpm lint:check`: Check linting
- `pnpm lint:fix`: Auto-fix linting
- `pnpm typecheck`: Type check all packages
- `pnpm test`: Run all unit tests
- `pnpm test:e2e`: Run E2E tests

### Testing

- **Unit tests**: Use Vitest with `@testing-library/svelte` for Svelte components
- **E2E tests**: Use Playwright (requires `area/ci/e2e` label on PR to run in CI)
- Write tests for new features
- Maintain or improve test coverage

## Important Patterns

### Dependency Injection

The project uses **Inversify** for DI. When adding new services:

1. Define interfaces for services
2. Create implementations with `@injectable()` decorator
3. Bind in the appropriate binding file (`inversify-binding.ts`)
4. Inject dependencies via constructor or via property

### Stream Objects

For streaming data (logs, terminal output), use the `StreamObject` pattern:

```typescript
export interface StreamObject<T, U> {
  subscribe(
    podName: string,
    namespace: string,
    containerName: string,
    options: U,
    callback: (data: T) => void,
  ): Promise<IDisposable>;
}
```

### RPC Communication

- All webview ↔ extension communication goes through RPC channels
- Define channel interfaces in `packages/channels`
- Use typed RPC methods for type safety

### Resource Management

- Implement `IDisposable` for resources that need cleanup
- Always dispose of subscriptions, timers, and event listeners
- Use try/finally or cleanup functions in effects

## Common Tasks

### Adding a New Kubernetes Resource View

1. Create component in `packages/webview/src/component/`
2. Add RPC method in `packages/rpc` if needed
3. Add route in webview router
4. Update navigation/menu if needed
5. Add tests

### Adding a New Feature

1. Determine if it needs extension-side code (Kubernetes API access)
2. Create RPC methods if needed
3. Implement webview UI using components from Podman Desktop UI library (`@podman-desktop/ui-svelte`)
4. Add proper error handling
5. Write tests
6. Update documentation if needed

### Debugging

- Extension logs: Check Podman Desktop console
- Webview logs: Check browser devtools (if webview is debuggable)
- Use `console.log` sparingly, prefer proper logging
- Check RPC channel communication for issues

## Code Quality

- **ESLint**: Comprehensive linting with strict rules
- **Prettier**: Code formatting (check `.prettierrc`)
- **TypeScript**: Strict type checking
- **Svelte Check**: Svelte-specific validation
- All checks must pass before committing

## License

Apache 2.0 - Include license header in new files:

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

Update headers for modified files, with the current year:

```typescript
/**********************************************************************
 * Copyright (C) 2024 - 2026 Red Hat, Inc.
[...]
```


## Additional Resources

- See `docs/data-flow.md` for data flow documentation
- Check existing components for patterns and conventions
- Review `.github/workflows/` for CI/CD requirements
