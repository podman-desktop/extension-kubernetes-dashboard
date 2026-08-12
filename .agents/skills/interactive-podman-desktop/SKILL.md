---
name: interactive-podman-desktop
description: >-
  Guides launching Podman Desktop interactively inside a Linux container with
  the Kubernetes Dashboard extension loaded, and connecting to it via
  Playwright's CDP protocol. Useful for manual exploration, AI-assisted
  interaction (e.g. via a Playwright MCP server), or ad-hoc scripting.
  Triggers when launching Podman Desktop for interactive use in a container,
  connecting via CDP, or using a Playwright MCP server with the extension.
---

# Running Podman Desktop Interactively with Playwright

Instead of running the E2E test suite, you can launch Podman Desktop with the
extension loaded and interact with it programmatically through Playwright's CDP
connection. This is useful for manual exploration, AI-assisted interaction (e.g.
with a Playwright MCP server), or ad-hoc scripting.

All executable scripts are in the `scripts/` directory alongside this file.

## Prerequisites

Complete the following from the `e2e-container` skill before proceeding:

1. Install prerequisites (`scripts/install-prerequisites.sh`)
2. Step 1: Install a Podman Desktop testing binary — see below
3. Step 2: Build the extension plugin (`scripts/build-extension-plugin.sh`)
4. Step 3: Start the envtest Kubernetes cluster (`scripts/start-envtest.sh`)

### Podman Desktop Binary

Podman Desktop may already be installed on the system (e.g., at
`/usr/local/lib/podman-desktop/`). Before running `install-pd-binary.sh`,
check if the binary exists:

```sh
which podman-desktop || ls /usr/local/lib/podman-desktop/podman-desktop
```

If it is already installed but not at the path expected by the launch script
(`tests/playwright/tests/PodmanDesktop/podman-desktop`), create symlinks:

```sh
ln -sf /usr/local/lib/podman-desktop/podman-desktop \
  tests/playwright/tests/PodmanDesktop/podman-desktop
ln -sf /usr/local/lib/podman-desktop/podman-desktop.real \
  tests/playwright/tests/PodmanDesktop/podman-desktop.real
```

Only run `install-pd-binary.sh` if Podman Desktop is not installed at all.

### xdpyinfo

The `xdpyinfo` tool is required to detect the Xvfb display resolution. Install
it if not available:

```sh
sudo dnf install -y xdpyinfo
```

## Verify Shared Library Dependencies

Before launching Podman Desktop, check that all shared libraries required by
the Electron binary are available:

```sh
ldd tests/playwright/tests/PodmanDesktop/podman-desktop.real | grep "not found"
```

If any libraries are missing, install them using the prerequisites script from
the `e2e-container` skill.

## Bootstrap Checklist

Before launching, verify each dependency is ready. The `launch-podman-desktop.sh`
script runs these checks automatically and will abort with clear error messages
if anything is missing:

| Check | How to verify | Fix |
|-------|--------------|-----|
| Xvfb running | `[ -e /tmp/.X11-unix/X99 ]` | Run `start-xvfb.sh` |
| D-Bus system bus | `[ -S /run/dbus/system_bus_socket ]` | Run `start-xvfb.sh` |
| PD binary exists | `[ -x tests/playwright/tests/PodmanDesktop/podman-desktop ]` | Create symlinks or run `install-pd-binary.sh` |
| Shared libraries | `ldd ...podman-desktop.real \| grep "not found"` — empty | Install missing libs |
| envtest kubeconfig | `[ -f /tmp/envtest-kubeconfig ]` | Run `start-envtest.sh` |
| Extension plugin | `[ -d .../plugins/extension/dist ]` | Run `build-extension-plugin.sh` |

**Important**: Do NOT use `pgrep -f` to check for running processes — it
matches the shell process executing the grep command, giving false positives.
Use filesystem markers (`/tmp/.X11-unix/X99`, `/run/dbus/system_bus_socket`)
instead.

## Launch Podman Desktop

### Step 1: Start Xvfb and D-Bus

```sh
bash skills/interactive-podman-desktop/scripts/start-xvfb.sh
```

This script is idempotent — it checks filesystem markers before starting
services, and will restart Xvfb if the resolution doesn't match. Default
resolution is 1024x768 (matching the video recording size). Override with
`XVFB_RESOLUTION=1920x1080` if needed.

### Step 2: Create the Podman Desktop profile and launch

```sh
bash skills/interactive-podman-desktop/scripts/launch-podman-desktop.sh
```

This script:
1. Runs pre-flight checks (all items in the Bootstrap Checklist above)
2. Creates a profile with unnecessary extensions disabled
3. Copies the envtest kubeconfig to `~/.kube/config`
4. Launches Podman Desktop with CDP on port 9222
5. Waits up to 20s for the CDP endpoint to become available
6. Maximizes the window to fill the Xvfb display

No manual verification needed — the script reports success or failure.

## Connecting with Playwright

### From a Node.js script

```js
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const pages = browser.contexts()[0].pages();
// pages[0] is the Podman Desktop shell
// pages[1] is the Kubernetes Dashboard extension webview (available after
//          clicking the "Kubernetes" link in the sidebar)
const page = pages[0];

await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

### From a Playwright MCP server

Connect the MCP server to the same `http://127.0.0.1:9222` CDP endpoint. After
clicking the **Kubernetes** link in the sidebar, the extension webview opens as
a separate tab (tab index 1) — switch to it to interact with the Kubernetes
Dashboard.

**WARNING**: Do NOT use `browser_navigate` when connected via CDP to an Electron
app. It navigates the app's own window to the given URL, destroying the app UI.
Use only `browser_snapshot`, `browser_click`, `browser_find`, and `browser_tabs`.

## Tips for Playwright MCP Interaction

### Tab Management

Confirmation dialogs (e.g., delete confirmations) appear on the main Podman
Desktop tab (tab index 0), not on the extension webview tab (tab index 1).
When triggering an action from the extension that opens a dialog, switch to
tab 0 to find and interact with the dialog, then switch back to tab 1.

### Monaco Editor

The Monaco code editor (used in Patch and Apply tabs) does not respond to
Playwright's `pressSequentially` or `fill` methods. To type into Monaco:

1. Click on a `div.view-line` element at the target line.
2. Use individual key presses: `End` to move to end of line, `Enter` to
   create a new line.
3. Type content character by character using `browser_press_key`.

#### Handling auto-indent

Monaco auto-indents new lines, but the indentation level it chooses is
unpredictable — especially inside YAML arrays, where it may align to a new
array element or inside the current element depending on context. Do **not**
rely on Monaco's auto-indent being correct.

Instead, use the **Enter → Shift+Home → Delete** sequence to bypass
auto-indent entirely:

1. Press `Enter` — Monaco creates a new line with auto-indented whitespace.
2. Press `Shift+Home` — selects all auto-indent whitespace from cursor to
   the start of the line.
3. Press `Delete` — removes the selected whitespace, placing the cursor at
   column 0.
4. Type the line with exact leading spaces (e.g., `  - kind: User` with
   2 spaces, or `    name: eve` with 4 spaces).

This guarantees the cursor starts at column 0, giving you full control over
indentation regardless of what Monaco's auto-indent would have done.

**Why not Backspace?** Monaco's smart Backspace jumps by tab stops and may
land at the wrong column. Shift+Home → Delete is deterministic.
