#!/bin/bash
# Remove all generated files after stopping the cluster.

set -euo pipefail

rm -rf tests/playwright/tests/
rm -f tests/resources/envtest-kubeconfig tests/resources/envtest-kubeconfig-user1
rm -f /tmp/envtest-kubeconfig /tmp/user1-kubeconfig

echo "Cleanup complete"
