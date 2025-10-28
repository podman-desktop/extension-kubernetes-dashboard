/**********************************************************************
 * Copyright (C) 2024, 2025 Red Hat, Inc.
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

import type { KubernetesObject, V1Pod, V1PodList, V1Status } from '@kubernetes/client-node';
import { CoreV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory, SelectorOptions } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';
import { MetadataExplorer } from './objects/metadata-explorer.js';
import type { ContextsManager } from '/@/manager/contexts-manager.js';

export class PodsResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor(protected contextsManager: ContextsManager) {
    super({
      resource: 'pods',
      kind: 'Pod',
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
          resource: 'pods',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deletePod);
    this.setSearchBySelector(this.searchPodsBySelector);
    this.setReadObject(this.readPod);
    this.setRestartObject(this.restartPod);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Pod> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const listFn = (): Promise<V1PodList> => apiClient.listNamespacedPod({ namespace });
    const path = `/api/v1/namespaces/${namespace}/pods`;
    return new ResourceInformer<V1Pod>({ kubeconfig, path, listFn, kind: this.kind, plural: 'pods' });
  }

  deletePod(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    return apiClient.deleteNamespacedPod({ name, namespace });
  }

  async searchPodsBySelector(
    kubeconfig: KubeConfigSingleContext,
    options: SelectorOptions,
    namespace: string,
  ): Promise<V1Pod[]> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const list = await apiClient.listNamespacedPod({ namespace, ...options });
    return list.items;
  }

  async readPod(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<V1Pod> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    return apiClient.readNamespacedPod({ name, namespace });
  }

  async restartPod(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<void> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const pod = await apiClient.readNamespacedPod({ name, namespace });
    if (!pod.metadata?.name || !pod.metadata?.namespace) {
      throw new Error('metadata of pod not found');
    }

    const metadataExplorer = new MetadataExplorer(pod.metadata);
    const controller = metadataExplorer.getController();
    if (!controller) {
      const newPod = {
        apiVersion: pod.apiVersion,
        kind: pod.kind,
        metadata: metadataExplorer.getUserOnlyMetadata(),
        spec: pod.spec,
      };
      await this.restartStandalonePod(apiClient, pod.metadata.name, pod.metadata.namespace, newPod);
    } else if (controller.kind === 'Job') {
      await this.contextsManager.restartObject(controller.kind, controller.name, namespace);
    } else {
      // We just delete the pod, we expect the controller to create a new one
      await apiClient.deleteNamespacedPod({ name, namespace });
    }
  }

  protected async restartStandalonePod(
    apiClient: CoreV1Api,
    name: string,
    namespace: string,
    newPod: V1Pod,
  ): Promise<void> {
    await apiClient.deleteNamespacedPod({ name, namespace });

    const isDeleted = await this.contextsManager.waitForObjectDeletion('pods', name, namespace);
    if (!isDeleted) {
      throw new Error(`pod "${name}" in namespace "${namespace}" was not deleted within the expected timeframe`);
    }

    await apiClient.createNamespacedPod({ namespace, body: newPod });
  }
}
