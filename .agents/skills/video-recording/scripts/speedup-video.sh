#!/bin/bash
# Speed up a video by a given factor.
# Usage: speedup-video.sh <input-video> <output-video> <speed-factor>
#
# Example: speedup-video.sh demo-1x.mp4 demo-4x.mp4 4

set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <input-video> <output-video> <speed-factor>" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
SPEED="$3"

PTS_FACTOR=$(python3 -c "print(1.0 / $SPEED)")

echo "Speeding up ${SPEED}x (setpts=${PTS_FACTOR}*PTS)..."
ffmpeg -y -i "$INPUT" \
  -vf "setpts=${PTS_FACTOR}*PTS" \
  -an \
  -c:v libopenh264 -pix_fmt yuv420p \
  "$OUTPUT"

SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
DUR=$(ffmpeg -i "$OUTPUT" 2>&1 | grep Duration | awk '{print $2}' | tr -d ',')
echo "Output: $OUTPUT ($SIZE, $DUR)"
