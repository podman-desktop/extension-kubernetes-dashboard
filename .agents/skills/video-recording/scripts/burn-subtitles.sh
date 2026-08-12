#!/bin/bash
# Burn SRT subtitles into a video file.
# Usage: burn-subtitles.sh <raw-video> <srt-file> <output-video> [max-duration-seconds]
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <raw-video> <srt-file> <output-video> [max-duration-seconds]" >&2
  exit 1
fi

RAW="$1"
SRT="$2"
OUTPUT="$3"
DURATION="${4:-}"

DURATION_ARGS=""
if [ -n "$DURATION" ]; then
  DURATION_ARGS="-t $DURATION"
fi

ffmpeg -y -i "$RAW" $DURATION_ARGS \
  -vf "subtitles=${SRT}:force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,MarginV=30'" \
  -c:v libopenh264 -pix_fmt yuv420p \
  "$OUTPUT"

SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
DUR=$(ffmpeg -i "$OUTPUT" 2>&1 | grep Duration | awk '{print $2}' | tr -d ',')
echo "Output: $OUTPUT ($SIZE, $DUR)"
