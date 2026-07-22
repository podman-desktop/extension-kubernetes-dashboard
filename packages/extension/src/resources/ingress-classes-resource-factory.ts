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

import type { KubernetesObject, V1IngressClass, V1IngressClassList, V1Status } from '@kubernetes/client-node';
import { NetworkingV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class IngressClassesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'ingressclasses',
      kind: 'IngressClass',
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
          group: 'networking.k8s.io',
          resource: 'ingressclasses',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteIngressClass);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1IngressClass> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NetworkingV1Api);
    const listFn = (): Promise<V1IngressClassList> => apiClient.listIngressClass();
    const path = `/apis/networking.k8s.io/v1/ingressclasses`;
    return new ResourceInformer<V1IngressClass>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: 'ingressclasses',
    });
  }

  deleteIngressClass(kubeconfig: KubeConfigSingleContext, name: string): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NetworkingV1Api);
    return apiClient.deleteIngressClass({ name });
  }
}
