/**********************************************************************
 * Copyright (C) 2024, 2025 Red Hat, Inc.
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

import type { KubernetesObject, V1Pod, V1PodList, V1Status } from '@kubernetes/client-node';
import { CoreV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory, SelectorOptions } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class PodsResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'pods',
      kind: 'Pod',
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
          resource: 'pods',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer,
    });
    this.setDeleteObject(this.deletePod);
    this.setSearchBySelector(this.searchPodsBySelector);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Pod> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const listFn = (): Promise<V1PodList> => apiClient.listNamespacedPod({ namespace });
    const path = `/api/v1/namespaces/${namespace}/pods`;
    return new ResourceInformer<V1Pod>({ kubeconfig, path, listFn, kind: this.kind, plural: 'pods' });
  }

  deletePod(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    return apiClient.deleteNamespacedPod({ name, namespace });
  }

  async searchPodsBySelector(
    kubeconfig: KubeConfigSingleContext,
    options: SelectorOptions,
    namespace: string,
  ): Promise<V1Pod[]> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const list = await apiClient.listNamespacedPod({ namespace, ...options });
    console.log('list', list);
    return list.items;
  }
}
