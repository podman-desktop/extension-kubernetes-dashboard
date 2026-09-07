/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import type { KubernetesObject } from '@kubernetes/client-node';

import type { GatewayUI } from './GatewayUI';

interface GatewaySpec {
  gatewayClassName?: string;
  listeners?: { name?: string; port?: number; protocol?: string }[];
}

interface GatewayStatus {
  addresses?: { type?: string; value?: string }[];
}

export class GatewayHelper {
  getGatewayUI(o: KubernetesObject): GatewayUI {
    const spec = (o as unknown as { spec?: GatewaySpec }).spec;
    const gwStatus = (o as unknown as { status?: GatewayStatus }).status;

    const listeners = (spec?.listeners ?? [])
      .map(l => `${l.name ?? ''}:${l.port ?? ''}/${l.protocol ?? ''}`)
      .join(', ');
    const addresses = (gwStatus?.addresses ?? [])
      .map(a => a.value ?? '')
      .filter(Boolean)
      .join(', ');

    return {
      kind: 'Gateway',
      uid: o.metadata?.uid ?? '',
      name: o.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: o.metadata?.namespace ?? '',
      created: o.metadata?.creationTimestamp,
      selected: false,
      gatewayClassName: spec?.gatewayClassName ?? '',
      listeners,
      addresses,
    };
  }
}
