#!/bin/bash
# Start Xvfb and D-Bus for headless Electron operation.
# Idempotent — safe to run multiple times.
#
# The default resolution is 1024x768 to match the video recording size.
# Override with XVFB_RESOLUTION=1920x1080 if needed.

set -euo pipefail

: "${XVFB_RESOLUTION:=1024x768}"

# --- Xvfb ---
if [ -e /tmp/.X11-unix/X99 ]; then
  CURRENT_RES=$(ps -eo args | grep '^Xvfb :99' | grep -oP '\d+x\d+x\d+' | head -1 || true)
  if [ "$CURRENT_RES" = "${XVFB_RESOLUTION}x24" ]; then
    echo "Xvfb already running on :99 at ${XVFB_RESOLUTION}"
  else
    echo "Xvfb running at $CURRENT_RES but ${XVFB_RESOLUTION}x24 requested — restarting"
    pkill -x Xvfb || true
    sleep 1
    rm -f /tmp/.X99-lock
    Xvfb :99 -screen 0 "${XVFB_RESOLUTION}x24" &
    sleep 0.5
    echo "Xvfb restarted on :99 at ${XVFB_RESOLUTION}"
  fi
else
  rm -f /tmp/.X99-lock
  Xvfb :99 -screen 0 "${XVFB_RESOLUTION}x24" &
  sleep 0.5
  echo "Xvfb started on :99 at ${XVFB_RESOLUTION}"
fi

# --- D-Bus system bus ---
if [ -S /run/dbus/system_bus_socket ]; then
  echo "D-Bus system bus already running"
else
  sudo mkdir -p /run/dbus
  if [ -f /run/dbus/pid ] && ! kill -0 "$(cat /run/dbus/pid)" 2>/dev/null; then
    sudo rm -f /run/dbus/pid
  fi
  sudo dbus-daemon --system --fork 2>/dev/null || true
  echo "D-Bus system bus started"
fi
