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

import { expect, test, vi } from 'vitest';
import { JobsResourceFactory } from './jobs-resource-factory';
import type { ContextsManager } from '/@/manager/contexts-manager';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import type { BatchV1Api, KubeConfig, V1Job } from '@kubernetes/client-node';

const contextsManager: ContextsManager = {
  waitForObjectDeletion: vi.fn(),
  restartObject: vi.fn(),
} as unknown as ContextsManager;

const kubeConfigMock = {
  makeApiClient: vi.fn(),
} as unknown as KubeConfig;
const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () => kubeConfigMock,
} as unknown as KubeConfigSingleContext;

test('readObject is set by factory', () => {
  const factory = new JobsResourceFactory(contextsManager);
  expect(factory.readObject).toBeDefined();
});

test('restartObject', async () => {
  const apiClientMock = {
    readNamespacedJob: vi.fn(),
    deleteNamespacedJob: vi.fn(),
    createNamespacedJob: vi.fn(),
  } as unknown as BatchV1Api;
  vi.mocked(kubeConfigMock.makeApiClient).mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.readNamespacedJob).mockResolvedValue({
    metadata: {
      name: 'job1',
      namespace: 'namespace1',
      creationTimestamp: new Date(),
      resourceVersion: '1',
      selfLink: '/apis/batch/v1/namespaces/namespace1/jobs/job1',
      uid: '1',
      ownerReferences: [],
      labels: {
        'job-name': 'job1',
        'controller-uid': '1',
        'batch.kubernetes.io/controller-uid': '1',
        'batch.kubernetes.io/job-name': 'job1',
        'other-label': 'other-value',
      },
    },
    spec: {
      template: {
        metadata: {
          name: 'job1',
          labels: {
            'job-name': 'job1',
            'controller-uid': '1',
            'batch.kubernetes.io/controller-uid': '1',
            'batch.kubernetes.io/job-name': 'job1',
            'other-label': 'other-value',
          },
        },
      },
      selector: {
        matchLabels: {
          'job-name': 'job1',
        },
      },
    },
    status: {
      conditions: [],
    },
  } as unknown as V1Job);
  const factory = new JobsResourceFactory(contextsManager);
  expect(factory.restartObject).toBeDefined();

  vi.mocked(contextsManager.waitForObjectDeletion).mockResolvedValue(true);

  await factory.restartObject(kubeconfig, 'job1', 'namespace1');

  expect(apiClientMock.deleteNamespacedJob).toHaveBeenCalledWith({
    name: 'job1',
    namespace: 'namespace1',
    propagationPolicy: 'Foreground',
  });
  expect(apiClientMock.createNamespacedJob).toHaveBeenCalledWith({
    namespace: 'namespace1',
    body: {
      metadata: {
        name: 'job1',
        namespace: 'namespace1',
        labels: {
          'other-label': 'other-value',
        },
      },
      spec: {
        template: {
          metadata: {
            name: 'job1',
            labels: {
              'other-label': 'other-value',
            },
          },
        },
      },
    },
  });
});
