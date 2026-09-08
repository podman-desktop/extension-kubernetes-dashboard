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

import type { KubernetesObject, V1PriorityClass, V1PriorityClassList, V1Status } from '@kubernetes/client-node';
import { SchedulingV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class PriorityClassesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'priorityclasses',
      kind: 'PriorityClass',
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
          group: 'scheduling.k8s.io',
          verb: 'watch',
          resource: 'priorityclasses',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deletePriorityClass);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1PriorityClass> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(SchedulingV1Api);
    const listFn = (): Promise<V1PriorityClassList> => apiClient.listPriorityClass();
    const path = `/apis/scheduling.k8s.io/v1/priorityclasses`;
    return new ResourceInformer<V1PriorityClass>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: 'priorityclasses',
    });
  }

  deletePriorityClass(kubeconfig: KubeConfigSingleContext, name: string): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(SchedulingV1Api);
    return apiClient.deletePriorityClass({ name });
  }
}
