#!/bin/bash
# Download the latest Podman Desktop nightly Linux arm64 build and create
# a wrapper that passes --disable-dev-shm-usage to work around the 64 MB
# /dev/shm limit in containers.

set -euo pipefail

LATEST_TAG=$(gh api repos/podman-desktop/testing-prereleases/releases \
  --jq 'sort_by(.created_at) | reverse | first(.[] | select(.assets | length > 0)) | .tag_name')

echo "Downloading Podman Desktop tag: $LATEST_TAG"

gh release download "$LATEST_TAG" \
  --repo podman-desktop/testing-prereleases \
  --pattern '*-arm64.tar.gz'

mkdir -p tests/playwright/tests/PodmanDesktop
tar xz --strip-components=1 \
  -C tests/playwright/tests/PodmanDesktop \
  -f podman-desktop-*-arm64.tar.gz
rm podman-desktop-*-arm64.tar.gz

PDDIR=tests/playwright/tests/PodmanDesktop
mv "$PDDIR/podman-desktop" "$PDDIR/podman-desktop.real"

cat > "$PDDIR/podman-desktop" << 'WRAPPER'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/podman-desktop.real" --disable-dev-shm-usage "$@"
WRAPPER
chmod +x "$PDDIR/podman-desktop"

echo "Podman Desktop installed at $PDDIR/podman-desktop"
