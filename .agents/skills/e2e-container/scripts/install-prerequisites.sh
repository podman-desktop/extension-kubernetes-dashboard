#!/bin/bash
# Install prerequisites for running E2E tests in a Linux container.

set -euo pipefail

# Go PATH
if ! echo "$PATH" | grep -q "$(go env GOPATH)/bin"; then
  export PATH="$PATH:$(go env GOPATH)/bin"
  echo 'export PATH="$PATH:$(go env GOPATH)/bin"' >> ~/.bashrc
  echo "Added Go bin to PATH"
fi

# kubectl
if ! command -v kubectl &>/dev/null; then
  cat <<'REPO' | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.36/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.36/rpm/repodata/repomd.xml.key
REPO
  sudo dnf install -y kubectl
  echo "Installed kubectl $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
fi

# envtest tools
go install github.com/feloy/envtest-start@v0.1.0
go install sigs.k8s.io/controller-runtime/tools/setup-envtest@release-0.22

# Xvfb and Electron shared libraries (Fedora / RHEL-based)
sudo dnf install -y \
  xorg-x11-server-Xvfb \
  nspr nss \
  atk at-spi2-atk at-spi2-core \
  cups-libs dbus-libs dbus-daemon \
  cairo gtk3 pango \
  libXcomposite libXdamage libXfixes libXrandr \
  mesa-libgbm alsa-lib \
  dbus-x11

# For Debian / Ubuntu-based containers, comment the dnf block above and
# uncomment the following:
# sudo apt-get install -y xvfb libnss3 libatk1.0-0 libatk-bridge2.0-0 \
#   libcups2 libdbus-1-3 dbus dbus-x11 libcairo2 libgtk-3-0 libpango-1.0-0 \
#   libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libatspi2.0-0
