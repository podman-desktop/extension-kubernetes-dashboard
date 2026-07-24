---
name: e2e-container
description: >-
  Guides running Playwright E2E tests for the Kubernetes Dashboard extension
  inside a Linux container (e.g. on macOS via Docker/Podman). Covers
  prerequisites, installing a Podman Desktop testing binary, building the
  extension plugin without podman, starting an envtest cluster, running the
  tests via CDP mode (no test runner patching needed), and cleanup.
  Triggers when running E2E tests inside a container, setting up a containerised
  test environment, or troubleshooting headless Electron issues.
---

# Running E2E Tests in a Linux Container

> **Platform:** Tested and supported on **macOS/arm64** only. The container
> images, binary downloads, and scripts assume an ARM64 host.

This skill covers running the Playwright E2E test suite from inside a Linux
arm64 container where `podman`, `brew`, and macOS-specific tools (`hdiutil`,
`codesign`) are unavailable.

All executable scripts are in the `scripts/` directory alongside this file.

## Prerequisites

These tools must be available in the container. Use the check commands to verify,
and install anything missing.

| Tool                 | Check command                                             |
| -------------------- | --------------------------------------------------------- |
| Go                   | `go version`                                              |
| kubectl              | `kubectl version --client`                                |
| Go PATH              | `echo $PATH \| grep -q "$(go env GOPATH)/bin" && echo ok` |
| envtest tools        | `command -v envtest-start && command -v setup-envtest`    |
| Xvfb + Electron libs | `command -v Xvfb`                                         |
| dbus-launch          | `command -v dbus-launch`                                  |

Run the prerequisites install script to install everything:

```sh
bash .agents/skills/e2e-container/scripts/install-prerequisites.sh
```

This installs Go PATH setup, envtest tools, Xvfb with Electron shared
libraries, and `dbus-x11` (for `dbus-launch`). For Debian/Ubuntu containers,
follow the commented instructions in the script.

## Step-by-Step Workflow

### Step 1: Install a Podman Desktop testing binary

Downloads the latest nightly Linux arm64 build and creates a wrapper script
that passes `--disable-dev-shm-usage` to work around the 64 MB `/dev/shm`
limit in containers:

```sh
bash .agents/skills/e2e-container/scripts/install-pd-binary.sh
```

### Step 2: Build the extension plugin

Without `podman`, this replicates the container export by copying build output
directly into the plugins directory:

```sh
bash .agents/skills/e2e-container/scripts/build-extension-plugin.sh
```

### Step 3: Start the envtest Kubernetes cluster

Starts a local Kubernetes API server via envtest and waits for the kubeconfig
to be written:

```sh
bash .agents/skills/e2e-container/scripts/start-envtest.sh
```

The script exports `KUBEBUILDER_ASSETS` and backgrounds the `envtest-start`
process. The PID is saved to `/tmp/envtest-start.pid` for later cleanup.

### Step 4: Run the tests

Copies kubeconfigs and runs the E2E suite using CDP mode:

```sh
bash .agents/skills/e2e-container/scripts/run-tests.sh
```

**How it works:** Setting `DEBUGGING_PORT` switches the test runner to
`ChromeDevToolsProtocolRunner`, which launches Electron with
`--remote-debugging-port` and connects via CDP — the same mechanism used by
the interactive Podman Desktop skill. This avoids `recordVideo` in
`electron.launch()`, which triggers Chromium's `Page.startScreencast` and
blocks the compositor in GPU-less containers.

### Step 5: Stop the cluster

```sh
bash .agents/skills/e2e-container/scripts/stop-envtest.sh
```

## Restarting the Tests

**Quick restart** — only the cluster needs to be restarted: redo steps 3 and 4,
keeping `EXTENSION_PREINSTALLED=true`.

**Full clean restart** (e.g. after modifying extension sources) — after stopping
the cluster, reset the Podman Desktop profile:

```sh
rm -rf tests/playwright/tests/playwright/
```

Then redo steps 2, 3, and 4.

## Cleanup

After stopping the cluster (step 5), remove all generated files:

```sh
bash .agents/skills/e2e-container/scripts/cleanup.sh
```
