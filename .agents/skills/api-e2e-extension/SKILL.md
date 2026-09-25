---
name: api-e2e-extension
description: >-
  Guides building, side-loading, running, debugging, and extending the
  test-only Podman Desktop extension that exercises the Kubernetes Dashboard
  public API. Triggers when working in tests/api-e2e-extension, adding public
  API E2E coverage, investigating helper-extension activation or bridge
  failures, or explaining how the API E2E harness runs locally and in CI. Not
  for ordinary dashboard UI E2E tests.
---

# Dashboard API E2E Consumer Extension

The API E2E harness tests the exported Kubernetes Dashboard API through a real
consumer extension running inside Podman Desktop. Keep this boundary intact:
Playwright must call the consumer extension, which obtains the dashboard API
with `extensions.getExtension()`. Do not import dashboard backend internals into
the tests.

```text
Playwright
    -> authenticated loopback HTTP bridge
    -> API E2E consumer extension
    -> extensions.getExtension('podman-desktop.kubernetes-dashboard')
    -> exported Kubernetes Dashboard API
    -> envtest cluster
```

## Important Files

| File                                                   | Purpose                                              |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `tests/api-e2e-extension/package.json`                 | Podman Desktop manifest and build commands           |
| `tests/api-e2e-extension/vite.config.ts`               | Produces the CommonJS extension entry point          |
| `tests/api-e2e-extension/scripts/install.mjs`          | Side-loads the built extension into the test profile |
| `tests/api-e2e-extension/src/main.ts`                  | Podman Desktop `activate`/`deactivate` entry point   |
| `tests/api-e2e-extension/src/dashboard-api-bridge.ts`  | Authenticated, typed HTTP bridge                     |
| `tests/playwright/src/utility/dashboard-api-client.ts` | Typed Playwright-side bridge client                  |
| `tests/playwright/src/dashboard-api.ts`                | Public API E2E cases                                 |
| `tests/playwright/src/extension.spec.ts`               | Runner profile and suite lifecycle                   |

## How It Is Built and Installed

This helper is side-loaded; it is not installed through the Extensions UI or
from an OCI image.

1. The root `pnpm test:e2e:integration` command changes into
   `tests/playwright` and invokes `npm run test:e2e:integration`.
2. npm automatically runs `pretest:e2e:integration` first.
3. The pre-hook runs the helper's `prepare:e2e` script.
4. Vite builds `src/main.ts` as `dist/main.js`. Keep
   `@podman-desktop/api` external because Podman Desktop provides it at runtime.
5. `install.mjs` recreates the helper directory under the Playwright profile's
   `plugins` folder, copies `dist`, and writes a stripped `package.json` plus
   `bridge-config.json`.
6. The Playwright runner starts Podman Desktop with that profile as
   `PODMAN_DESKTOP_HOME_DIR`.
7. Podman Desktop scans `PODMAN_DESKTOP_HOME_DIR/plugins`, reads the copied
   manifest, loads `dist/main.js`, and calls `activate()`.

The resulting profile contains two sibling extensions:

```text
PODMAN_DESKTOP_HOME_DIR/
|-- api-e2e-bridge.json                 # runtime handshake
`-- plugins/
    |-- extension/                      # dashboard extension from the CI artifact
    `-- kubernetes-dashboard-api-e2e/   # test consumer
        |-- package.json
        |-- bridge-config.json
        `-- dist/main.js
```

### Profile Path Invariant

The test command runs with `tests/playwright` as its working directory. With the
runner's default output folder and `customFolder: 'kubernetes-dashboard-tests'`,
the repository-relative profile is:

```text
tests/playwright/tests/playwright/output/kubernetes-dashboard-tests
```

This path is intentionally shared by:

- `runnerFolder` in `scripts/install.mjs`;
- `bridgeConfigFile` in `dashboard-api-client.ts`;
- the `RunnerOptions` configuration in `extension.spec.ts`; and
- the extension artifact destination in `.github/workflows/e2e-tests.yaml`.

If the runner output or custom folder changes, update and verify all four. A
path mismatch usually appears as a missing helper activation or a handshake
timeout.

## Activation and Bridge Lifecycle

`activate()` reads `bridge-config.json` relative to
`extensionContext.extensionUri`, starts the bridge, and registers it for
disposal. The bridge:

- binds an ephemeral port on `127.0.0.1` only;
- requires the generated bearer token on every request;
- writes the selected host and port to the handshake file;
- resolves the dashboard extension API when handling requests, allowing either
  extension to activate first;
- exposes only explicit typed routes; and
- disposes one-shot event registrations and dashboard subscribers.

The Playwright client reads the bridge configuration, waits for the handshake,
then polls `/health` until the dashboard API is available.

Keep the token, loopback binding, body-size limit, bounded timeouts, structured
error serialization, and disposal behavior when extending the bridge.

## Running It

Build and side-load only the helper:

```sh
pnpm --filter @kubernetes-dashboard/api-e2e-extension run prepare:e2e
```

Run the integration suite with automatic helper installation:

```sh
pnpm test:e2e:integration
```

The full run requires `PODMAN_DESKTOP_BINARY` and the envtest kubeconfig under
`tests/resources/`. See the `playwright-testing` skill for cluster setup.

Do not use a direct `playwright test` command for a clean run unless the helper
has already been prepared: direct Playwright invocation bypasses npm's
`pretest:e2e:integration` lifecycle hook.

Expected startup evidence includes:

- `Installed Kubernetes Dashboard API E2E extension in .../plugins/...`;
- Podman Desktop activating
  `podman-desktop.@kubernetes-dashboard/api-e2e-extension`; and
- the `Dashboard extension API` tests appearing after kubeconfig setup.

The registry-update message for this test-only extension can be ignored; it is
side-loaded and deliberately absent from the extension registry.

## Adding Coverage for a Public API Method

Only reference methods available in the branch's public API declaration.

1. Add request types to `src/types.ts` when the method accepts a body.
2. Add an explicit route in `dashboard-api-bridge.ts`. Do not implement a
   generic route that indexes arbitrary exported methods.
3. Preserve relevant typed error fields in bridge responses.
4. Add a typed wrapper to `dashboard-api-client.ts`.
5. Add focused cases to `dashboard-api.ts`.
6. Verify the result independently through the cluster when testing mutations,
   rather than treating the API response alone as proof.
7. Restore modified monitoring configuration and delete test resources so later
   UI tests remain isolated.

For one-shot subscriptions, always dispose both the listener registration and
the dashboard subscriber in `finally`. Apply an inner timeout slightly shorter
than the Playwright polling deadline so retries remain possible.

## Verification

Run focused checks before the full E2E suite:

```sh
pnpm --filter @kubernetes-dashboard/api-e2e-extension run typecheck
pnpm --filter @kubernetes-dashboard/api-e2e-extension run build
pnpm exec eslint tests/api-e2e-extension tests/playwright/src/dashboard-api.ts tests/playwright/src/utility/dashboard-api-client.ts
pnpm exec prettier --check tests/api-e2e-extension tests/playwright/src/dashboard-api.ts tests/playwright/src/utility/dashboard-api-client.ts
```

The helper TypeScript project must include both `src` and `scripts`, with
`allowJs` enabled, because repository-wide type-aware ESLint analyzes
`scripts/install.mjs`.

For discovery without launching Podman Desktop, prepare the helper first and
then list the API suite from `tests/playwright`:

```sh
pnpm --filter @kubernetes-dashboard/api-e2e-extension run prepare:e2e
pnpm exec playwright test src/ --grep "Dashboard extension API" --list
```

Do not modify the production OCI image or Containerfile to carry the test
consumer. CI downloads the production dashboard plugin and the pre-hook adds
the test consumer beside it in the isolated Playwright profile.
