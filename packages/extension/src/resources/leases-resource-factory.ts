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

import type { KubernetesObject, V1Lease, V1LeaseList, V1Status } from '@kubernetes/client-node';
import { CoordinationV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class LeasesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'leases',
      kind: 'Lease',
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
          group: 'coordination.k8s.io',
          verb: 'watch',
          resource: 'leases',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteLease);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Lease> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoordinationV1Api);
    const listFn = (): Promise<V1LeaseList> => apiClient.listNamespacedLease({ namespace });
    const path = `/apis/coordination.k8s.io/v1/namespaces/${namespace}/leases`;
    return new ResourceInformer<V1Lease>({ kubeconfig, path, listFn, kind: this.kind, plural: 'leases' });
  }

  deleteLease(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoordinationV1Api);
    return apiClient.deleteNamespacedLease({ name, namespace });
  }
}
