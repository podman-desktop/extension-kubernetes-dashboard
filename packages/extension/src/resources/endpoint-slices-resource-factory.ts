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

import {
  DiscoveryV1Api,
  type V1EndpointSliceList,
  type V1EndpointSlice,
  type KubernetesObject,
} from '@kubernetes/client-node';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { TargetRef } from '@kubernetes-dashboard/channels';
import { ResourceInformer } from '/@/types/resource-informer.js';
import type { ContextsManager } from '/@/manager/contexts-manager.js';

export class EndpointSlicesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor(protected contextsManager: ContextsManager) {
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
    this.setInformer({
      createInformer: this.createInformer,
    });

    this.setSearchByTargetRef(this.searchEndpointSlicesByTargetRef);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1EndpointSlice> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(DiscoveryV1Api);
    const listFn = (): Promise<V1EndpointSliceList> => apiClient.listNamespacedEndpointSlice({ namespace });
    const path = `/apis/discovery.k8s.io/v1/namespaces/${namespace}/endpointslices`;
    return new ResourceInformer<V1EndpointSlice>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: 'endpointslices',
    });
  }

  searchEndpointSlicesByTargetRef(kubeconfig: KubeConfigSingleContext, targetRef: TargetRef): V1EndpointSlice[] {
    const list = this.contextsManager.getResources(this.resource, kubeconfig.getKubeConfig().currentContext);
    return list
      .filter(this.isV1EndpointSlice)
      .filter(item =>
        item.endpoints?.some(
          endpoint =>
            endpoint.targetRef?.name === targetRef.name &&
            endpoint.targetRef?.namespace === targetRef.namespace &&
            endpoint.targetRef?.kind === targetRef.kind,
        ),
      );
  }

  protected isV1EndpointSlice(object: KubernetesObject): object is V1EndpointSlice {
    return 'endpoints' in object;
  }
}
