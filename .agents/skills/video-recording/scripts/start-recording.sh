#!/bin/bash
# Start recording the Xvfb display to an MP4 file.
# Usage: start-recording.sh [output-path]
set -euo pipefail

: "${DISPLAY:=:99}"
: "${FRAMERATE:=15}"
export DISPLAY

SCREEN_RES=$(DISPLAY="$DISPLAY" xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}' | head -1 || true)
: "${VIDEO_SIZE:=${SCREEN_RES:-1024x768}}"

OUTPUT="${1:-./recording-raw.mp4}"

ffmpeg -y -f x11grab -video_size "$VIDEO_SIZE" -framerate "$FRAMERATE" \
  -i "$DISPLAY" -c:v libopenh264 -pix_fmt yuv420p \
  "$OUTPUT" > /tmp/video-recording.log 2>&1 &

FFMPEG_PID=$!
echo "$FFMPEG_PID" > /tmp/video-recording.pid
date +%s%3N > /tmp/video-start-time

sleep 1
if ! kill -0 "$FFMPEG_PID" 2>/dev/null; then
  echo "ERROR: ffmpeg failed to start. Check /tmp/video-recording.log" >&2
  cat /tmp/video-recording.log >&2
  exit 1
fi

echo "Recording started (PID: $FFMPEG_PID)"
echo "Output: $OUTPUT"
echo "Start time: $(cat /tmp/video-start-time)"
