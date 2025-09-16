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

import type { KubernetesObject, V1Ingress, V1IngressList, V1Status } from '@kubernetes/client-node';
import { NetworkingV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';
import type { TargetRef } from '/@common/model/target-ref.js';
import type { ContextsManager } from '/@/manager/contexts-manager.js';

export class IngressesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor(protected contextsManager: ContextsManager) {
    super({
      resource: 'ingresses',
      kind: 'Ingress',
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
          group: 'networking.k8s.io',
          resource: 'ingresses',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer,
    });
    this.setDeleteObject(this.deleteIngress);
    this.setSearchByTargetRef(this.searchIngressesByTargetRef);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Ingress> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NetworkingV1Api);
    const listFn = (): Promise<V1IngressList> => apiClient.listNamespacedIngress({ namespace });
    const path = `/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`;
    return new ResourceInformer<V1Ingress>({ kubeconfig, path, listFn, kind: this.kind, plural: 'ingresses' });
  }

  deleteIngress(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(NetworkingV1Api);
    return apiClient.deleteNamespacedIngress({ name, namespace });
  }

  searchIngressesByTargetRef(kubeconfig: KubeConfigSingleContext, targetRef: TargetRef): V1Ingress[] {
    // We only support targetting services, either by default backend or by rules
    // TODO handle other kinds of targets (through the spec.rules.http.paths.backend.resource)
    if (targetRef.kind !== 'Service') {
      return [];
    }

    const list = this.contextsManager.getResources(this.resource, kubeconfig.getKubeConfig().currentContext);

    const matchinDefaultBackend = list.filter(
      (item: V1Ingress) => item.spec?.defaultBackend?.service?.name === targetRef.name,
    );
    const matchinRules = list.filter((item: V1Ingress) =>
      item.spec?.rules?.some(rule => rule.http?.paths?.some(path => path.backend?.service?.name === targetRef.name)),
    );
    const nonUnique = [...matchinDefaultBackend, ...matchinRules];
    return nonUnique.filter(
      (item, index, self) => self.findIndex(t => t.metadata?.name === item.metadata?.name) === index,
    );
  }
}
