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

import type {
  KubernetesObject,
  V1Status,
  V2HorizontalPodAutoscaler,
  V2HorizontalPodAutoscalerList,
} from '@kubernetes/client-node';
import { AutoscalingV2Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class HpasResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({
      resource: 'horizontalpodautoscalers',
      kind: 'HorizontalPodAutoscaler',
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
          group: 'autoscaling',
          verb: 'watch',
          resource: 'horizontalpodautoscalers',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteHorizontalPodAutoscaler);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V2HorizontalPodAutoscaler> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AutoscalingV2Api);
    const listFn = (): Promise<V2HorizontalPodAutoscalerList> =>
      apiClient.listNamespacedHorizontalPodAutoscaler({ namespace });
    const path = `/apis/autoscaling/v2/namespaces/${namespace}/horizontalpodautoscalers`;
    return new ResourceInformer<V2HorizontalPodAutoscaler>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      plural: 'horizontalpodautoscalers',
    });
  }

  deleteHorizontalPodAutoscaler(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(AutoscalingV2Api);
    return apiClient.deleteNamespacedHorizontalPodAutoscaler({ name, namespace });
  }
}
