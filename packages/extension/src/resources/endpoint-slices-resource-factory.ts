/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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

import { DiscoveryV1Api, type V1EndpointSlice } from '@kubernetes/client-node';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { TargetRef } from '/@common/model/target-ref.js';

export class EndpointSlicesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'endpointslices',
      kind: 'EndpointSlice',
    });

    this.setPermissions({
      isNamespaced: true,
      permissionsRequests: [
        {
          group: '*',
          resource: '*',
          verb: 'watch',
        },
        {
          verb: 'watch',
          resource: 'endpointslices',
          group: 'discovery.k8s.io',
        },
      ],
    });

    this.setSearchByTargetRef(this.searchEndpointSlicesByTargetRef);
  }

  async searchEndpointSlicesByTargetRef(
    kubeconfig: KubeConfigSingleContext,
    targetRef: TargetRef,
  ): Promise<V1EndpointSlice[]> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(DiscoveryV1Api);
    const list = await apiClient.listNamespacedEndpointSlice({ namespace: targetRef.namespace });
    return list.items.filter(item =>
      item.endpoints?.some(
        endpoint =>
          endpoint.targetRef?.name === targetRef.name &&
          endpoint.targetRef?.namespace === targetRef.namespace &&
          endpoint.targetRef?.kind === targetRef.kind,
      ),
    );
  }
}
