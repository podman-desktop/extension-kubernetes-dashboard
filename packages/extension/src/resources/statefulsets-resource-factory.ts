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

import type { KubernetesObject, V1StatefulSet, V1StatefulSetList, V1Status } from '@kubernetes/client-node';
import { AppsV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class StatefulSetsResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'statefulsets',
      kind: 'StatefulSet',
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
          group: 'apps',
          resource: 'statefulsets',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setIsActive(this.isStatefulSetActive);
    this.setDeleteObject(this.deleteStatefulSet);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1StatefulSet> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AppsV1Api);
    const listFn = (): Promise<V1StatefulSetList> => apiClient.listNamespacedStatefulSet({ namespace });
    const path = `/apis/apps/v1/namespaces/${namespace}/statefulsets`;
    return new ResourceInformer<V1StatefulSet>({ kubeconfig, path, listFn, kind: this.kind, plural: 'statefulsets' });
  }

  isStatefulSetActive(statefulSet: V1StatefulSet): boolean {
    return (statefulSet.spec?.replicas ?? 0) > 0;
  }

  deleteStatefulSet(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AppsV1Api);
    return apiClient.deleteNamespacedStatefulSet({ name, namespace });
  }
}
