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
  CoreV1Api,
  type V1Namespace,
  type V1NamespaceList,
  type V1Status,
  type KubernetesObject,
} from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory, SelectorOptions } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class NamespacesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'namespaces',
      kind: 'Namespace',
    });

    this.setPermissions({
      isNamespaced: false,
      permissionsRequests: [
        {
          group: '*',
          resource: '*',
          verb: 'watch',
        },
        {
          verb: 'watch',
          resource: 'namespaces',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer,
    });
    this.setDeleteObject(this.deleteNamespace);
    this.setSearchBySelector(this.searchNamespacesBySelector);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Namespace> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const listFn = (): Promise<V1NamespaceList> => apiClient.listNamespace();
    const path = `/api/v1/namespaces`;
    return new ResourceInformer<V1Namespace>({ kubeconfig, path, listFn, kind: this.kind, plural: 'namespaces' });
  }

  deleteNamespace(kubeconfig: KubeConfigSingleContext, name: string): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    return apiClient.deleteNamespace({ name });
  }

  async searchNamespacesBySelector(
    kubeconfig: KubeConfigSingleContext,
    options: SelectorOptions,
  ): Promise<V1Namespace[]> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const list = await apiClient.listNamespace({ ...options });
    return list.items;
  }
}
