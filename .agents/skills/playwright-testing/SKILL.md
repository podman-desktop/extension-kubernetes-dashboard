---
name: playwright-testing
description: >-
  Guides writing and maintaining Playwright E2E tests for the Kubernetes
  Dashboard Podman Desktop extension. Covers the webview-aware test framework,
  envtest/Kubebuilder setup, extension lifecycle, and spec file patterns.
  Triggers when creating or modifying E2E spec files, debugging Playwright
  failures, or asking about the E2E test framework.
paths:
  - tests/playwright/**/*.ts
---

# Playwright E2E Testing for Kubernetes Dashboard Extension

This extension runs inside Podman Desktop as a webview. E2E tests launch Podman
Desktop via Electron, install the extension from an OCI image, then interact
with the extension's webview UI.

## Project Structure

```
tests/playwright/
├── src/
│   ├── extension.spec.ts           # Main E2E spec file
│   └── ...
├── resources/
│   └── envtest-kubeconfig          # Test kubeconfig (copied from /tmp/)
├── playwright.config.ts            # Playwright configuration
└── package.json
```

## Prerequisites

E2E tests require a local Kubernetes API server via envtest (Kubebuilder):

1. Install `setup-envtest`:
   ```sh
   go install sigs.k8s.io/controller-runtime/tools/setup-envtest@release-0.22
   ```
2. Install `envtest-start`:
   ```sh
   go install github.com/feloy/envtest-start@latest
   ```
3. Set up assets and start:
   ```sh
   export KUBEBUILDER_ASSETS=$(setup-envtest use -p path)
   envtest-start &
   ```
4. Copy kubeconfig:
   ```sh
   cp /tmp/envtest-kubeconfig tests/resources/
   ```

## Running Tests

```sh
# Set the Podman Desktop binary path
export PODMAN_DESKTOP_BINARY=/path/to/podman-desktop

# First run (installs extension)
pnpm test:e2e

# Subsequent runs (skip install)
EXTENSION_PREINSTALLED=true pnpm test:e2e
```

## Test Framework

Tests use `@podman-desktop/tests-playwright` which provides:

- `test` — Extended Playwright test with Podman Desktop fixtures
- `expect` / `playExpect` — Assertions
- `RunnerOptions` — Test runner configuration
- `PreferencesPage`, `NavigationBar`, etc. — Page objects

## Spec File Pattern

```typescript
import {
  test,
  expect as playExpect,
  RunnerOptions,
} from '@podman-desktop/tests-playwright';

test.beforeAll(async ({ runner, welcomePage }) => {
  test.setTimeout(80_000);
  runner.setVideoAndTraceName('kubernetes-dashboard-e2e');
  await welcomePage.handleWelcomePage(true);
});

test.describe('Feature group', { tag: ['@integration'] }, () => {
  test('should do something', async ({ navigationBar }) => {
    const dashboardPage = await navigationBar.openDashboard();
    // interact with pages
  });
});
```

## CI Integration

E2E tests are not run by default on PRs. Add the `area/ci/e2e` label to
trigger them. The CI workflow is in `.github/workflows/e2e-tests.yaml`.

## Test Tags

- `@integration` — Full integration tests (requires auth)
- `@anonymous` — Tests that run without Kubernetes authentication
