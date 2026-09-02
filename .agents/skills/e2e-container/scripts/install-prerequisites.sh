#!/bin/bash
# Install prerequisites for running E2E tests in a Linux container.

set -euo pipefail

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
go install sigs.k8s.io/controller-runtime/tools/setup-envtest@release-0.24

# Xvfb and Electron shared libraries (Fedora / RHEL-based)
sudo dnf install -y \
  xorg-x11-server-Xvfb \
  nspr nss \
  atk at-spi2-atk at-spi2-core \
  cups-libs dbus-libs dbus-daemon \
  cairo gtk3 pango \
  libXcomposite libXdamage libXfixes libXrandr \
  mesa-libgbm alsa-lib \
  dbus-x11 \
  xdpyinfo xdotool
