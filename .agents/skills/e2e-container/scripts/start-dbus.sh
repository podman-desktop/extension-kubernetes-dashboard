#!/bin/bash
# Start Xvfb, D-Bus system bus, and D-Bus session bus.
# Required each time the container starts.
# Exports DISPLAY and DBUS_SESSION_BUS_ADDRESS.

set -euo pipefail

# Xvfb
if ! [ -e /tmp/.X11-unix/X99 ]; then
  Xvfb :99 -screen 0 1280x960x24 >/dev/null 2>&1 &
  sleep 0.5
  echo "Xvfb started on display :99" >&2
fi
export DISPLAY=:99

# D-Bus system bus
if ! pgrep -f "dbus-daemon --system" >/dev/null 2>&1; then
  sudo mkdir -p /run/dbus
  sudo dbus-daemon --system --fork
  echo "D-Bus system bus started" >&2
fi

# D-Bus session bus (needed by Electron's renderer process)
if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
  eval $(dbus-launch --sh-syntax)
  echo "D-Bus session bus started: $DBUS_SESSION_BUS_ADDRESS" >&2
fi

echo "export DISPLAY=$DISPLAY"
echo "export DBUS_SESSION_BUS_ADDRESS=$DBUS_SESSION_BUS_ADDRESS"
