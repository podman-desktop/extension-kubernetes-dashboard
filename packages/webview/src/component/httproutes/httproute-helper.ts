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

import type { HttpRouteUI } from './HttpRouteUI';

interface HttpRouteSpec {
  parentRefs?: { name?: string; namespace?: string }[];
  hostnames?: string[];
  rules?: { backendRefs?: { name?: string; port?: number }[] }[];
}

export class HttpRouteHelper {
  getHttpRouteUI(o: KubernetesObject): HttpRouteUI {
    const spec = (o as unknown as { spec?: HttpRouteSpec }).spec;

    const hostnames = spec?.hostnames ?? [];
    const parentRefs = (spec?.parentRefs ?? [])
      .map(r => r.name ?? '')
      .filter(Boolean)
      .join(', ');
    const backendRefs = (spec?.rules ?? [])
      .flatMap(r => r.backendRefs ?? [])
      .map(b => (b.port ? `${b.name}:${b.port}` : (b.name ?? '')))
      .filter(Boolean)
      .join(', ');

    return {
      kind: 'HTTPRoute',
      uid: o.metadata?.uid ?? '',
      name: o.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: o.metadata?.namespace ?? '',
      created: o.metadata?.creationTimestamp,
      selected: false,
      hostnames,
      parentRefs,
      backendRefs,
    };
  }
}
