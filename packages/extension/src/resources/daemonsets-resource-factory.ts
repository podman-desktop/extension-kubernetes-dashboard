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

import type { KubernetesObject, V1DaemonSet, V1DaemonSetList, V1Status } from '@kubernetes/client-node';
import { AppsV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class DaemonSetsResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'daemonsets',
      kind: 'DaemonSet',
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
          resource: 'daemonsets',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setIsActive(this.isDaemonSetActive);
    this.setDeleteObject(this.deleteDaemonSet);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1DaemonSet> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AppsV1Api);
    const listFn = (): Promise<V1DaemonSetList> => apiClient.listNamespacedDaemonSet({ namespace });
    const path = `/apis/apps/v1/namespaces/${namespace}/daemonsets`;
    return new ResourceInformer<V1DaemonSet>({ kubeconfig, path, listFn, kind: this.kind, plural: 'daemonsets' });
  }

  isDaemonSetActive(daemonSet: V1DaemonSet): boolean {
    return (daemonSet.status?.desiredNumberScheduled ?? 0) > 0;
  }

  deleteDaemonSet(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AppsV1Api);
    return apiClient.deleteNamespacedDaemonSet({ name, namespace });
  }
}
