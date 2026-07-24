#!/bin/bash
# Copy kubeconfigs and run the E2E test suite.
#
# Uses DEBUGGING_PORT to switch the test runner to CDP mode
# (ChromeDevToolsProtocolRunner), which avoids recordVideo and the
# compositor-blocking screencast that hangs in GPU-less containers.

set -euo pipefail

export PATH="$PATH:$(go env GOPATH)/bin"
export KUBEBUILDER_ASSETS=${KUBEBUILDER_ASSETS:-$(setup-envtest use -p path)}

# Ensure DISPLAY and DBUS_SESSION_BUS_ADDRESS are set
# (needed by the CDP runner which spawns Electron directly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
eval "$("$SCRIPT_DIR/start-dbus.sh")"

cp /tmp/envtest-kubeconfig tests/resources/envtest-kubeconfig
cp /tmp/user1-kubeconfig tests/resources/envtest-kubeconfig-user1

CI=true \
DEBUGGING_PORT=9333 \
EXTENSION_PREINSTALLED=true \
PODMAN_DESKTOP_BINARY="$(pwd)/tests/playwright/tests/PodmanDesktop/podman-desktop" \
KUBEBUILDER_ASSETS="$KUBEBUILDER_ASSETS" \
NODE_OPTIONS=--no-experimental-strip-types \
pnpm test:e2e:integration
