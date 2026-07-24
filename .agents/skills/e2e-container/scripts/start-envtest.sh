#!/bin/bash
# Start the envtest Kubernetes cluster and wait for the kubeconfig.

set -euo pipefail

export KUBEBUILDER_ASSETS=$(setup-envtest use -p path)

envtest-start --users 1 /tmp/envtest-kubeconfig &
ENVTEST_START_PID=$!
echo "$ENVTEST_START_PID" > /tmp/envtest-start.pid

echo "Waiting for envtest kubeconfig..."
while [ ! -f /tmp/envtest-kubeconfig ]; do sleep 1; done

"$KUBEBUILDER_ASSETS/kubectl" --kubeconfig /tmp/envtest-kubeconfig get all | grep "service/kubernetes"
echo "envtest cluster running (PID: $ENVTEST_START_PID)"
echo "KUBEBUILDER_ASSETS=$KUBEBUILDER_ASSETS"
