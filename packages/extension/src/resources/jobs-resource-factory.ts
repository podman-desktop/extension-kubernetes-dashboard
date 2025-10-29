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

import type { KubernetesObject, V1Job, V1JobList, V1Status } from '@kubernetes/client-node';
import { BatchV1Api } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';
import { type ContextsManager } from '/@/manager/contexts-manager.js';

export class JobsResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor(protected contextsManager: ContextsManager) {
    super({
      resource: 'jobs',
      kind: 'Job',
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
          group: 'batch',
          verb: 'watch',
          resource: 'jobs',
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
    this.setDeleteObject(this.deleteJob);
    this.setReadObject(this.readJob);
    this.setRestartObject(this.restartJob);
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Job> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(BatchV1Api);
    const listFn = (): Promise<V1JobList> => apiClient.listNamespacedJob({ namespace });
    const path = `/apis/batch/v1/namespaces/${namespace}/jobs`;
    return new ResourceInformer<V1Job>({ kubeconfig, path, listFn, kind: this.kind, plural: 'jobs' });
  }

  deleteJob(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(BatchV1Api);
    return apiClient.deleteNamespacedJob({ name, namespace });
  }

  async readJob(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<V1Job> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(BatchV1Api);
    return apiClient.readNamespacedJob({ name, namespace });
  }

  async restartJob(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<void> {
    const batchApi = kubeconfig.getKubeConfig().makeApiClient(BatchV1Api);

    const existingJob = await batchApi.readNamespacedJob({ name, namespace });
    await batchApi.deleteNamespacedJob({
      name,
      namespace,
      propagationPolicy: 'Foreground',
    });

    const isJobDeleted = await this.contextsManager.waitForObjectDeletion('jobs', name, namespace);
    if (!isJobDeleted) {
      throw new Error(`job "${name}" in namespace "${namespace}" was not deleted within the expected timeframe`);
    }

    delete existingJob.metadata!.creationTimestamp;
    delete existingJob.metadata!.resourceVersion;
    delete existingJob.metadata!.selfLink;
    delete existingJob.metadata!.uid;
    delete existingJob.metadata!.ownerReferences;
    delete existingJob.status;
    delete existingJob.spec!.selector;
    if (existingJob.spec!.template.metadata!.labels) {
      delete existingJob.spec!.template.metadata!.labels['controller-uid'];
      delete existingJob.spec!.template.metadata!.labels['batch.kubernetes.io/controller-uid'];
      delete existingJob.spec!.template.metadata!.labels['batch.kubernetes.io/job-name'];
      delete existingJob.spec!.template.metadata!.labels['job-name'];
    }
    if (existingJob.metadata?.labels) {
      delete existingJob.metadata.labels['controller-uid'];
      delete existingJob.metadata.labels['batch.kubernetes.io/controller-uid'];
      delete existingJob.metadata.labels['batch.kubernetes.io/job-name'];
      delete existingJob.metadata.labels['job-name'];
    }

    await batchApi.createNamespacedJob({ namespace, body: existingJob });
  }
}
