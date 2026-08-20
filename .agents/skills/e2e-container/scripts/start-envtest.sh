#!/bin/bash
# Start the envtest Kubernetes cluster and wait for the kubeconfig.

set -euo pipefail

KUBEBUILDER_ASSETS="$(setup-envtest use -p path)"
export KUBEBUILDER_ASSETS

envtest-start --users 1 /tmp/envtest-kubeconfig &
ENVTEST_START_PID=$!
echo "$ENVTEST_START_PID" > /tmp/envtest-start.pid

cleanup() {
  kill "$ENVTEST_START_PID" 2>/dev/null || true
  wait "$ENVTEST_START_PID" 2>/dev/null || true
}

echo "Waiting for envtest kubeconfig..."
for i in $(seq 1 60); do
  if ! kill -0 "$ENVTEST_START_PID" 2>/dev/null; then
    echo "ERROR: envtest-start exited unexpectedly"
    wait "$ENVTEST_START_PID" 2>/dev/null || true
    exit 1
  fi
  [ -f /tmp/envtest-kubeconfig ] && break
  sleep 1
done
if [ ! -f /tmp/envtest-kubeconfig ]; then
  echo "ERROR: timed out waiting for envtest kubeconfig after 60s"
  cleanup
  exit 1
fi

echo "Waiting for API server readiness..."
for i in $(seq 1 15); do
  if "$KUBEBUILDER_ASSETS/kubectl" --kubeconfig /tmp/envtest-kubeconfig get all 2>/dev/null | grep -q "service/kubernetes"; then
    break
  fi
  sleep 1
done
if ! "$KUBEBUILDER_ASSETS/kubectl" --kubeconfig /tmp/envtest-kubeconfig get all 2>/dev/null | grep -q "service/kubernetes"; then
  echo "ERROR: API server not ready after 15s"
  cleanup
  exit 1
fi
echo "envtest cluster running (PID: $ENVTEST_START_PID)"
echo "KUBEBUILDER_ASSETS=$KUBEBUILDER_ASSETS"
