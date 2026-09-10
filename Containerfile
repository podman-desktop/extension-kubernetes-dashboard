#
# Copyright (C) 2025 - 2026 Red Hat, Inc.
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

# v10.1-1766363988
FROM registry.access.redhat.com/ubi10/nodejs-24@sha256:5a3cea874f0555bcde27d979bbc8a067f1d75b4b324ef3274112c8270e951f5b AS builder
USER root
RUN dnf install -y jq && npm i -g corepack && corepack enable
USER default

ENV HOME=/opt/app-root

WORKDIR /opt/app-root/extension-source
COPY --chown=1001:root . .

RUN corepack enable && corepack install && \
    CI=true pnpm --frozen-lockfile install

RUN pnpm build

RUN mkdir /opt/app-root/extension && \
      cp -r packages/extension/dist /opt/app-root/extension/ && \
      cp packages/extension/package.json /opt/app-root/extension/ && \
      cp packages/extension/*.png /opt/app-root/extension/ && \
      cp -r packages/extension/media /opt/app-root/extension/media && \
      cp pnpm-workspace.yaml /opt/app-root/extension/ && \
      mkdir -p /opt/app-root/extension/packages/rpc/ && \
      cp packages/rpc/package.json /opt/app-root/extension/packages/rpc/ && \
      mkdir -p /opt/app-root/extension/packages/channels/ && \
      cp packages/channels/package.json /opt/app-root/extension/packages/channels/ && \
      mkdir -p /opt/app-root/extension/packages/api/ && \
      cp packages/api/package.json /opt/app-root/extension/packages/api/

COPY LICENSE /opt/app-root/extension/
COPY README.md /opt/app-root/extension/

RUN eval 'dep_version() { pnpm list -P $1 --json --depth 0 |jq -r ".[0].dependencies.\"$1\".version"; };' && \
        ISOMORPHIC_WS_VERSION=$(dep_version "isomorphic-ws") && \
        echo adding isomorphic-ws version ${ISOMORPHIC_WS_VERSION} && \
        pnpm --dir /opt/app-root/extension --workspace-root add isomorphic-ws@${ISOMORPHIC_WS_VERSION} --prod

FROM scratch

LABEL org.opencontainers.image.title="Kubernetes Dashboard extension" \
      org.opencontainers.image.description="Kubernetes Dashboard extension" \
      org.opencontainers.image.vendor="podman-desktop" \
      io.podman-desktop.api.version=">= 1.26.0"

COPY --from=builder /opt/app-root/extension /extension
