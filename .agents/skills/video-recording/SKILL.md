---
name: video-recording
description: >-
  Guides recording a subtitled video of the running Podman Desktop app via
  Xvfb + ffmpeg. Covers installing ffmpeg, maximizing the Electron window,
  recording the Xvfb display, building an SRT subtitle file from navigation
  timestamps, burning subtitles, and optionally speeding up the final video.
  Triggers when capturing a demo video, screen recording, or creating a
  subtitled walkthrough of the app.
---

# Recording a Subtitled Video Session

Record the Podman Desktop Xvfb display while navigating the app, then produce
an MP4 with burned-in subtitles describing each section visited.

## Prerequisites

- Podman Desktop must already be running on Xvfb display `:99` with CDP on
  port 9222. Use the `interactive-podman-desktop` skill to set that up.
- A Playwright MCP server connected to the CDP endpoint, so you can navigate
  the app via `mcp__playwright__browser_*` tools.

## Step 0 — Install prerequisites

The `xdpyinfo` tool is required to detect the Xvfb display resolution:

```sh
sudo dnf install -y xdpyinfo
```

## Step 1 — Install ffmpeg

```sh
bash .agents/skills/video-recording/scripts/install-ffmpeg.sh
```

## Step 2 — Maximize the Electron window

The Electron window may not fill the Xvfb display by default, leaving black
borders in the recording. Maximize it before recording:

```sh
bash .agents/skills/video-recording/scripts/maximize-window.sh
```

Verify the window fills the display:

```sh
DISPLAY=:99 ffmpeg -y -f x11grab -video_size 1024x768 -framerate 15 \
  -i :99 -frames:v 1 -update 1 /tmp/check-frame.png 2>/dev/null
```

Then read `/tmp/check-frame.png` to confirm no black borders.

## Step 3 — Record the session

### Start recording

```sh
bash .agents/skills/video-recording/scripts/start-recording.sh [output-path]
```

- Default output: `./recording-raw.mp4`
- Saves PID to `/tmp/video-recording.pid`
- Saves start timestamp (epoch ms) to `/tmp/video-start-time`
- Uses `libopenh264` encoder (available in `ffmpeg-free` on Fedora)

### Navigate and collect timestamps

While recording, navigate the app using Playwright MCP tools. Before and after
each navigation action, capture a timestamp:

```sh
date +%s%3N
```

Keep a log of `(timestamp_ms, subtitle_text)` pairs as you navigate. For
example:

| Timestamp     | Event                                    |
| ------------- | ---------------------------------------- |
| 1786540681068 | Recording started (from start-time file) |
| 1786540693583 | Navigated to Nodes                       |
| 1786540702439 | Navigated to Deployments                 |
| 1786540713931 | Navigated back to Dashboard              |

### Stop recording

```sh
bash .agents/skills/video-recording/scripts/stop-recording.sh
```

## Step 4 — Build the SRT subtitle file

Use the collected timestamps and the start time to create an SRT file. The
helper script converts absolute epoch-ms timestamps to SRT timecodes:

```sh
bash .agents/skills/video-recording/scripts/build-srt.sh <output.srt> \
  <start_ms> \
  <begin_ms>,<end_ms>,<"subtitle text"> \
  <begin_ms>,<end_ms>,<"subtitle text"> \
  ...
```

Example:

```sh
bash .agents/skills/video-recording/scripts/build-srt.sh \
  ./demo.srt \
  1786540681068 \
  1786540681068,1786540693000,"Kubernetes Dashboard - Connected to cluster" \
  1786540693583,1786540701000,"Nodes - Cluster node information" \
  1786540702439,1786540712000,"Deployments - Application workloads" \
  1786540713931,1786540717000,"Dashboard - Cluster metrics overview"
```

## Step 5 — Burn subtitles into the final video

```sh
bash .agents/skills/video-recording/scripts/burn-subtitles.sh \
  <raw-video> <srt-file> <output-video> [max-duration-seconds]
```

Example:

```sh
bash .agents/skills/video-recording/scripts/burn-subtitles.sh \
  ./recording-raw.mp4 ./demo.srt ./demo-subtitled.mp4 37
```

The optional duration argument trims the video. Subtitles are rendered with
a white font, black outline, and bottom margin.

## Step 6 (optional) — Speed up the video

To create a sped-up version (e.g. 4x), use the `speedup-video.sh` script
**after** burning subtitles:

```sh
bash .agents/skills/video-recording/scripts/speedup-video.sh \
  <subtitled-video> <output-video> <speed-factor>
```

Example:

```sh
bash .agents/skills/video-recording/scripts/speedup-video.sh \
  ./demo-subtitled.mp4 ./demo-4x.mp4 4
```

**Important**: Always burn subtitles first at 1x speed, then speed up the
subtitled video. This way the SRT timecodes don't need adjustment. Speeding
up first and then trying to burn subtitles requires manually dividing all
SRT timecodes by the speed factor.

## Quick Reference

Full workflow in one block:

```sh
# 1. Install & maximize
bash .agents/skills/video-recording/scripts/install-ffmpeg.sh
bash .agents/skills/video-recording/scripts/maximize-window.sh

# 2. Record
bash .agents/skills/video-recording/scripts/start-recording.sh ./raw.mp4

# 3. (navigate the app, collect timestamps)

# 4. Stop & produce final video
bash .agents/skills/video-recording/scripts/stop-recording.sh
bash .agents/skills/video-recording/scripts/build-srt.sh ./demo.srt <start> <entries...>
bash .agents/skills/video-recording/scripts/burn-subtitles.sh ./raw.mp4 ./demo.srt ./demo-subtitled.mp4
bash .agents/skills/video-recording/scripts/speedup-video.sh ./demo-subtitled.mp4 ./demo-4x.mp4 4
```

## Notes

- `ffmpeg-free` on Fedora does not include `libx264`. Use `libopenh264` instead.
- The Xvfb display defaults to `:99`. If a different display is used, set
  `DISPLAY` before running the scripts.
- The default Xvfb resolution in `start-xvfb.sh` is 1024x768, matching the
  default recording size. Override with `XVFB_RESOLUTION=1920x1080` and
  `VIDEO_SIZE=1920x1080` for full HD.
- For complex interactions (Monaco editor, multi-tab dialogs), experiment
  without recording first to work out the exact steps. Once the flow is
  reliable, start a fresh recording. This avoids long retake sequences that
  need to be trimmed out.
- When editing in Monaco during a recording, use the **Enter → Shift+Home →
  Delete** sequence to bypass auto-indent before typing each new line. See
  the `interactive-podman-desktop` skill's Monaco Editor section for details.
