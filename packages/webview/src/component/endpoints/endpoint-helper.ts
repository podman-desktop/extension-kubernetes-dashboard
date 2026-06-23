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

import type { V1Endpoints } from '@kubernetes/client-node';

import type { EndpointUI } from './EndpointUI';

export class EndpointHelper {
  getEndpointUI(obj: V1Endpoints): EndpointUI {
    return {
      kind: 'Endpoints',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: obj.metadata?.namespace ?? '',
      created: obj.metadata?.creationTimestamp,
      selected: false,
      endpoints: (obj.subsets ?? []).flatMap(s => (s.addresses ?? []).map(a => a.ip)).join(', '),
      ports: (obj.subsets ?? []).flatMap(s => (s.ports ?? []).map(p => `${p.port}/${p.protocol ?? 'TCP'}`)).join(', '),
    };
  }
}
