#!/usr/bin/env bash
#
# Copyright (C) 2026 Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

: "${KUBEBUILDER_ASSETS:?}"
: "${KUBECONFIG:?}"
: "${KUBECONFIG_USER1:?}"
: "${MITM_DIR:?}"

kubectl="${KUBEBUILDER_ASSETS}/kubectl"
image='docker.io/mitmproxy/mitmproxy:12.2.3'
container_dir='/home/mitmproxy/.mitmproxy'
ca_cert="${MITM_DIR}/mitmproxy-ca-cert.pem"

umask 077
mkdir -p "$MITM_DIR"

# envtest uses its own CA and distinct client certificates for the admin and
# restricted users. TLS interception needs the original CA and matching client
# certificate on each new connection from mitmproxy to the API server.
"$kubectl" config view --raw --flatten --kubeconfig="$KUBECONFIG" \
  -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 --decode > "$MITM_DIR/upstream-ca.pem"
test -s "$MITM_DIR/upstream-ca.pem"

write_client_certificate() {
  local config="$1"
  local output="$2"

  "$kubectl" config view --raw --flatten --kubeconfig="$config" \
    -o jsonpath='{.users[0].user.client-key-data}' | base64 --decode > "$output"
  "$kubectl" config view --raw --flatten --kubeconfig="$config" \
    -o jsonpath='{.users[0].user.client-certificate-data}' | base64 --decode >> "$output"
  test -s "$output"
}

write_client_certificate "$KUBECONFIG" "$MITM_DIR/admin-client.pem"
write_client_certificate "$KUBECONFIG_USER1" "$MITM_DIR/user1-client.pem"

start_proxy() {
  local name="$1"
  local port="$2"

  # mitmproxy can return HTTP/2 protocol errors for Kubernetes API responses.
  # Stream watch responses so informer events reach the client before the watch ends.
  podman run -d --name "e2e-mitmproxy-$name" --network host \
    -v "$MITM_DIR:$container_dir" "$image" \
    mitmdump --mode regular --listen-host 127.0.0.1 --listen-port "$port" \
    --set flow_detail=1 --set http2=false --set stream_large_bodies=1 \
    --set "ssl_verify_upstream_trusted_ca=$container_dir/upstream-ca.pem" \
    --set "client_certs=$container_dir/$name-client.pem"
}

start_proxy admin 3129

# The second proxy shares the generated CA, but presents user1's client
# certificate upstream so authorization checks retain the correct identity.
for attempt in {1..30}; do
  if [[ -s "$ca_cert" ]]; then
    break
  fi
  sleep 1
done
test -s "$ca_cert"

start_proxy user1 3130

configure_kubeconfig() {
  local config="$1"
  local port="$2"

  "$kubectl" config set-cluster envtest --kubeconfig="$config" \
    --proxy-url="http://127.0.0.1:$port" \
    --certificate-authority="$ca_cert" --embed-certs=true

  for attempt in {1..10}; do
    if "$kubectl" --kubeconfig="$config" --request-timeout=10s get --raw=/version > /dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

configure_kubeconfig "$KUBECONFIG" 3129
configure_kubeconfig "$KUBECONFIG_USER1" 3130
