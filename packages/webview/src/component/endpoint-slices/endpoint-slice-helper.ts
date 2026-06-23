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

import type { KubernetesObject, V1EndpointSlice } from '@kubernetes/client-node';

import type { EndpointSliceUI } from './EndpointSliceUI';

export class EndpointSliceHelper {
  getEndpointSliceUI(o: KubernetesObject): EndpointSliceUI {
    const obj = o as V1EndpointSlice;
    return {
      kind: 'EndpointSlice',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: obj.metadata?.namespace ?? '',
      created: obj.metadata?.creationTimestamp,
      selected: false,
      addressType: obj.addressType ?? '',
      ports: (obj.ports ?? []).map(p => `${p.port}/${p.protocol ?? 'TCP'}`).join(', '),
      endpoints: obj.endpoints?.length ?? 0,
    };
  }
}
