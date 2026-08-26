#!/bin/bash
# Move and resize the Podman Desktop window to fill the Xvfb display.
set -euo pipefail

: "${DISPLAY:=:99}"
export DISPLAY

SCREEN_RES=$(DISPLAY="$DISPLAY" xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}' | head -1 || true)
SCREEN_W="${SCREEN_RES%x*}"
SCREEN_H="${SCREEN_RES#*x}"
: "${SCREEN_W:=1024}"
: "${SCREEN_H:=768}"

# The Electron window title may be "Podman Desktop" or "podman-desktop.real"
# depending on how it was launched. Try both.
WINDOW_ID=$(xdotool search --name "Podman Desktop" 2>/dev/null | head -1 || true)
if [ -z "$WINDOW_ID" ]; then
  WINDOW_ID=$(xdotool search --name "podman-desktop.real" 2>/dev/null | head -1 || true)
fi

if [ -z "$WINDOW_ID" ]; then
  echo "ERROR: Podman Desktop window not found on display $DISPLAY" >&2
  echo "Available windows:" >&2
  for wid in $(xdotool search --name "" 2>/dev/null || true); do
    echo "  $wid: $(xdotool getwindowname "$wid" 2>/dev/null || echo '(unnamed)')" >&2
  done
  exit 1
fi

xdotool windowmove "$WINDOW_ID" 0 0
xdotool windowsize "$WINDOW_ID" "$SCREEN_W" "$SCREEN_H"
echo "Podman Desktop window (ID: $WINDOW_ID) moved to 0,0 and resized to ${SCREEN_W}x${SCREEN_H}"
