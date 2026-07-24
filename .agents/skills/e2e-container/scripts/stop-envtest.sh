#!/bin/bash
# Stop the envtest cluster.

set -euo pipefail

if [ -f /tmp/envtest-start.pid ]; then
  kill "$(cat /tmp/envtest-start.pid)" 2>/dev/null || true
  rm -f /tmp/envtest-start.pid
  echo "envtest cluster stopped"
else
  echo "No envtest PID file found at /tmp/envtest-start.pid"
fi
