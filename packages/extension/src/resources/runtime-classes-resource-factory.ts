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

import type { KubernetesObject, V1RuntimeClass, V1RuntimeClassList, V1Status } from '@kubernetes/client-node';
import { NodeV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class RuntimeClassesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'runtimeclasses',
      kind: 'RuntimeClass',
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
          group: 'node.k8s.io',
          verb: 'watch',
          resource: 'runtimeclasses',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteRuntimeClass);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1RuntimeClass> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NodeV1Api);
    const listFn = (): Promise<V1RuntimeClassList> => apiClient.listRuntimeClass();
    const path = `/apis/node.k8s.io/v1/runtimeclasses`;
    return new ResourceInformer<V1RuntimeClass>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: 'runtimeclasses',
    });
  }

  deleteRuntimeClass(kubeconfig: KubeConfigSingleContext, name: string): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NodeV1Api);
    return apiClient.deleteRuntimeClass({ name });
  }
}
