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

import type { TargetRef, V1HTTPRoute } from '@kubernetes-dashboard/channels';

import type { ContextsManager } from '/@/manager/contexts-manager.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import { ResourceInformer } from '/@/types/resource-informer.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';

export class HTTPRoutesResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor(protected contextsManager: ContextsManager) {
    super({
      resource: 'httproutes',
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
          group: 'gateway.networking.k8s.io',
          resource: 'httproutes',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteHTTPRoute);
    this.setSearchByTargetRef(this.searchHTTPRoutesByTargetRef);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1HTTPRoute> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CustomObjectsApi);
    const listFn = (): Promise<KubernetesListObject<V1HTTPRoute>> =>
      apiClient.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace,
        plural: 'httproutes',
      });
    const path = `/apis/gateway.networking.k8s.io/v1/namespaces/${namespace}/httproutes`;
    return new ResourceInformer<V1HTTPRoute>({ kubeconfig, path, listFn, kind: this.kind, plural: 'httproutes' });
  }

  deleteHTTPRoute(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CustomObjectsApi);
    return apiClient.deleteNamespacedCustomObject({
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      plural: 'httproutes',
      name,
      namespace,
    });
  }

  searchHTTPRoutesByTargetRef(kubeconfig: KubeConfigSingleContext, targetRef: TargetRef): V1HTTPRoute[] {
    if (targetRef.kind !== 'Service') {
      return [];
    }

    const list = this.contextsManager.getResources(this.resource, kubeconfig.getKubeConfig().currentContext);
    return list.filter((item: V1HTTPRoute) =>
      item.spec?.rules?.some(rule =>
        rule.backendRefs?.some(backendRef => {
          const kind = backendRef.kind ?? 'Service';
          const namespace = backendRef.namespace ?? item.metadata?.namespace;
          return kind === targetRef.kind && backendRef.name === targetRef.name && namespace === targetRef.namespace;
        }),
      ),
    );
  }
}
