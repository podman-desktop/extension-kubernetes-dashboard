#!/bin/bash
# Create a Podman Desktop profile with unnecessary extensions disabled,
# copy the kubeconfig, and launch with CDP remote debugging on port 9222.
#
# Pre-flight checks ensure all dependencies are ready before launching.

set -euo pipefail

ERRORS=0

# --- Pre-flight checks ---

# Xvfb
if [ ! -e /tmp/.X11-unix/X99 ]; then
  echo "ERROR: Xvfb is not running on display :99. Run start-xvfb.sh first." >&2
  ERRORS=$((ERRORS + 1))
fi

# D-Bus system bus
if [ ! -S /run/dbus/system_bus_socket ]; then
  echo "ERROR: D-Bus system bus is not running. Run start-xvfb.sh first." >&2
  ERRORS=$((ERRORS + 1))
fi

# Podman Desktop binary
PD_DIR="$(pwd)/tests/playwright/tests/PodmanDesktop"
if [ ! -x "$PD_DIR/podman-desktop" ]; then
  if [ -x /usr/local/lib/podman-desktop/podman-desktop ]; then
    mkdir -p "$PD_DIR"
    ln -sf /usr/local/lib/podman-desktop/podman-desktop "$PD_DIR/podman-desktop"
    ln -sf /usr/local/lib/podman-desktop/podman-desktop.real "$PD_DIR/podman-desktop.real"
    echo "Created Podman Desktop symlinks from /usr/local/lib/podman-desktop/"
  else
    echo "ERROR: Podman Desktop binary not found at $PD_DIR/podman-desktop" >&2
    echo "       and not installed at /usr/local/lib/podman-desktop/" >&2
    ERRORS=$((ERRORS + 1))
  fi
fi

# Shared libraries
if [ -x "$PD_DIR/podman-desktop.real" ]; then
  MISSING_LIBS=$(ldd "$PD_DIR/podman-desktop.real" 2>/dev/null | grep "not found" || true)
  if [ -n "$MISSING_LIBS" ]; then
    echo "ERROR: Missing shared libraries:" >&2
    echo "$MISSING_LIBS" >&2
    ERRORS=$((ERRORS + 1))
  fi
fi

# envtest kubeconfig
if [ ! -f /tmp/envtest-kubeconfig ]; then
  echo "ERROR: envtest kubeconfig not found at /tmp/envtest-kubeconfig." >&2
  echo "       Run start-envtest.sh first." >&2
  ERRORS=$((ERRORS + 1))
fi

# Extension plugin
PLUGINS_DIR="$(pwd)/tests/playwright/tests/playwright/output/kubernetes-dashboard-tests/plugins/extension"
if [ ! -d "$PLUGINS_DIR/dist" ]; then
  echo "ERROR: Extension plugin not built at $PLUGINS_DIR" >&2
  echo "       Run build-extension-plugin.sh first." >&2
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "Pre-flight checks failed ($ERRORS error(s)). Aborting." >&2
  exit 1
fi

echo "Pre-flight checks passed"

# Kill any existing PD instance
if ps -eo args | grep -q '^.*podman-desktop.real.*--remote-debugging-port'; then
  echo "Stopping existing Podman Desktop instance..."
  pkill -f 'podman-desktop.real.*--remote-debugging-port' || true
  sleep 2
fi

# --- Create profile ---
CUSTOM_FOLDER="$(pwd)/tests/playwright/tests/playwright/output/kubernetes-dashboard-tests"
mkdir -p "$CUSTOM_FOLDER/configuration"

cat > "$CUSTOM_FOLDER/configuration/settings.json" << 'EOF'
{
  "extensions.disabled": [
    "podman-desktop.compose",
    "podman-desktop.docker",
    "podman-desktop.kind",
    "podman-desktop.kube-context",
    "podman-desktop.kubectl-cli",
    "podman-desktop.lima",
    "podman-desktop.minikube",
    "podman-desktop.onboarding",
    "podman-desktop.podman"
  ]
}
EOF

mkdir -p ~/.kube
cp /tmp/envtest-kubeconfig ~/.kube/config

# --- Launch ---
DISPLAY=:99 \
PODMAN_DESKTOP_HOME_DIR="$CUSTOM_FOLDER" \
XDG_SESSION_TYPE=x11 \
"$PD_DIR/podman-desktop" \
  --remote-debugging-port=9222 &>/tmp/pd-launch.log &

PD_PID=$!

# --- Wait for CDP ---
echo "Waiting for CDP endpoint on port 9222..."
for i in $(seq 1 20); do
  if ! kill -0 "$PD_PID" 2>/dev/null; then
    echo "ERROR: Podman Desktop exited unexpectedly. Last log:" >&2
    tail -20 /tmp/pd-launch.log >&2
    exit 1
  fi
  if curl -s http://127.0.0.1:9222/json 2>/dev/null | grep -q '"title"'; then
    echo "CDP ready after ${i}s (PID: $PD_PID)"
    break
  fi
  sleep 1
done

if ! curl -s http://127.0.0.1:9222/json 2>/dev/null | grep -q '"title"'; then
  echo "ERROR: CDP endpoint not available after 20s. Last log:" >&2
  tail -20 /tmp/pd-launch.log >&2
  exit 1
fi

# --- Maximize window ---
export DISPLAY=:99
sleep 2
SCREEN_RES=$(xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}' | head -1 || true)
SCREEN_W="${SCREEN_RES%x*}"
SCREEN_H="${SCREEN_RES#*x}"
: "${SCREEN_W:=1024}"
: "${SCREEN_H:=768}"

WINDOW_ID=$(xdotool search --name "podman-desktop.real" 2>/dev/null | head -1 || true)
if [ -z "$WINDOW_ID" ]; then
  WINDOW_ID=$(xdotool search --name "Podman Desktop" 2>/dev/null | head -1 || true)
fi
if [ -n "$WINDOW_ID" ]; then
  xdotool windowmove "$WINDOW_ID" 0 0
  xdotool windowsize "$WINDOW_ID" "$SCREEN_W" "$SCREEN_H"
  echo "Window maximized to ${SCREEN_W}x${SCREEN_H}"
else
  echo "WARNING: Could not find Podman Desktop window to maximize"
fi

echo "Podman Desktop ready. Verify with: curl -s http://127.0.0.1:9222/json"
