#!/bin/bash
# Build an SRT subtitle file from absolute epoch-ms timestamps.
#
# Usage: build-srt.sh <output.srt> <start_ms> <entry> [<entry> ...]
#   Each entry: <begin_ms>,<end_ms>,<"subtitle text">
#
# Example:
#   build-srt.sh demo.srt 1000000 \
#     1000000,1005000,"Welcome" \
#     1005500,1010000,"Section One"
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <output.srt> <start_ms> <begin,end,text> [...]" >&2
  exit 1
fi

OUTPUT="$1"
START="$2"
shift 2

ms_to_srt() {
  local rel=$(($1 - START))
  if [ "$rel" -lt 0 ]; then rel=0; fi
  printf "%02d:%02d:%02d,%03d" \
    $((rel / 3600000)) \
    $(((rel % 3600000) / 60000)) \
    $(((rel % 60000) / 1000)) \
    $((rel % 1000))
}

INDEX=1
> "$OUTPUT"

for entry in "$@"; do
  IFS=',' read -r begin end text <<< "$entry"
  # Strip surrounding quotes from text if present
  text="${text#\"}"
  text="${text%\"}"

  {
    echo "$INDEX"
    echo "$(ms_to_srt "$begin") --> $(ms_to_srt "$end")"
    echo "$text"
    echo ""
  } >> "$OUTPUT"

  INDEX=$((INDEX + 1))
done

echo "SRT written to $OUTPUT ($((INDEX - 1)) entries)"
