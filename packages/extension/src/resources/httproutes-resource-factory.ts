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

import type { KubernetesListObject, KubernetesObject, V1Status } from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

const GROUP = 'gateway.networking.k8s.io';
const VERSION = 'v1';
const PLURAL = 'httproutes';

export class HttpRoutesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: PLURAL,
      kind: 'HTTPRoute',
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
          group: GROUP,
          resource: PLURAL,
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteHttpRoute);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<KubernetesObject> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CustomObjectsApi);
    const listFn = (): Promise<KubernetesListObject<KubernetesObject>> =>
      apiClient.listNamespacedCustomObject({
        group: GROUP,
        version: VERSION,
        namespace,
        plural: PLURAL,
      }) as Promise<KubernetesListObject<KubernetesObject>>;
    const path = `/apis/${GROUP}/${VERSION}/namespaces/${namespace}/${PLURAL}`;
    return new ResourceInformer<KubernetesObject>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: PLURAL,
    });
  }

  deleteHttpRoute(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CustomObjectsApi);
    return apiClient.deleteNamespacedCustomObject({
      group: GROUP,
      version: VERSION,
      namespace,
      plural: PLURAL,
      name,
    }) as Promise<V1Status | KubernetesObject>;
  }
}
