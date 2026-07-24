#!/bin/bash
# Build the extension and copy it into the plugins directory.
# This replicates the container export without requiring podman.

set -euo pipefail

export CI=true

pnpm install
pnpm build

PLUGINS_DIR=tests/playwright/tests/playwright/output/kubernetes-dashboard-tests/plugins/extension

mkdir -p "$PLUGINS_DIR"

cp -r packages/extension/dist "$PLUGINS_DIR/"
cp packages/extension/package.json "$PLUGINS_DIR/"
cp packages/extension/*.png "$PLUGINS_DIR/"
cp -r packages/extension/media "$PLUGINS_DIR/media" 2>/dev/null || true
cp pnpm-workspace.yaml "$PLUGINS_DIR/"
mkdir -p "$PLUGINS_DIR/packages/rpc" "$PLUGINS_DIR/packages/channels" "$PLUGINS_DIR/packages/api"
cp packages/rpc/package.json "$PLUGINS_DIR/packages/rpc/"
cp packages/channels/package.json "$PLUGINS_DIR/packages/channels/"
cp packages/api/package.json "$PLUGINS_DIR/packages/api/"
cp LICENSE "$PLUGINS_DIR/"
cp README.md "$PLUGINS_DIR/"

ISOMORPHIC_WS_VERSION=$(node -e "console.log(require('./node_modules/isomorphic-ws/package.json').version)")
python3 -c "
import json, sys
with open('$PLUGINS_DIR/package.json') as f:
    d = json.load(f)
d.setdefault('dependencies', {})['isomorphic-ws'] = sys.argv[1]
d.pop('devDependencies', None)
d.pop('scripts', None)
with open('$PLUGINS_DIR/package.json', 'w') as f:
    json.dump(d, f, indent=2)
" "$ISOMORPHIC_WS_VERSION"

pnpm --dir "$PLUGINS_DIR" install --prod

echo "Extension plugin built at $PLUGINS_DIR"
