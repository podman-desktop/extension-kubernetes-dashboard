#!/bin/bash
# Stop the ffmpeg recording started by start-recording.sh.
set -euo pipefail

PID_FILE="/tmp/video-recording.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "ERROR: No recording PID file found at $PID_FILE" >&2
  exit 1
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  kill -INT "$PID"
  sleep 2
  echo "Recording stopped (PID: $PID)"
else
  echo "Recording process $PID is not running"
fi

echo "Start time was: $(cat /tmp/video-start-time 2>/dev/null || echo unknown)"
