#!/bin/bash
# Install ffmpeg-free and xdotool (for window management).
set -euo pipefail

if command -v ffmpeg &>/dev/null && command -v xdotool &>/dev/null; then
  echo "ffmpeg and xdotool already installed"
  exit 0
fi

sudo dnf install -y ffmpeg-free xdotool
echo "ffmpeg and xdotool installed"
