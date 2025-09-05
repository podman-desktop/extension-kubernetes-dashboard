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

import { expect, type MockedFunction, test, vi } from 'vitest';
import { PodsResourceFactory } from './pods-resource-factory';
import type { ContextsManager } from '/@/manager/contexts-manager';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import type { CoreV1Api, KubeConfig, V1Pod } from '@kubernetes/client-node';

const contextsManager: ContextsManager = {
  waitForObjectDeletion: vi.fn(),
  restartObject: vi.fn(),
} as unknown as ContextsManager;

const makeApiClientMock = vi.fn() as MockedFunction<KubeConfig['makeApiClient']>;

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      makeApiClient: makeApiClientMock,
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

test('readObject is set by factory', () => {
  const factory = new PodsResourceFactory(contextsManager);
  expect(factory.readObject).toBeDefined();
});

test('restartObject with standalone pod deletes the pod and recreates a new one', async () => {
  const apiClientMock = {
    readNamespacedPod: vi.fn(),
    deleteNamespacedPod: vi.fn(),
    createNamespacedPod: vi.fn(),
  } as unknown as CoreV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.readNamespacedPod).mockResolvedValue({
    metadata: {
      name: 'pod1',
      namespace: 'namespace1',
      creationTimestamp: new Date(),
    },
  } as unknown as V1Pod);
  const factory = new PodsResourceFactory(contextsManager);
  expect(factory.restartObject).toBeDefined();

  vi.mocked(contextsManager.waitForObjectDeletion).mockResolvedValue(true);

  await factory.restartObject(kubeconfig, 'pod1', 'namespace1');

  expect(contextsManager.waitForObjectDeletion).toHaveBeenCalledWith('pods', 'pod1', 'namespace1');
  expect(apiClientMock.createNamespacedPod).toHaveBeenCalledWith({
    namespace: 'namespace1',
    body: {
      metadata: {
        name: 'pod1',
        namespace: 'namespace1',
      },
    },
  });
});

test('restartObject with a pod managed by a Job restarts the Job', async () => {
  const apiClientMock = {
    readNamespacedPod: vi.fn(),
    deleteNamespacedPod: vi.fn(),
    createNamespacedPod: vi.fn(),
  } as unknown as CoreV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.readNamespacedPod).mockResolvedValue({
    metadata: {
      name: 'pod1',
      namespace: 'namespace1',
      creationTimestamp: new Date(),
      ownerReferences: [
        {
          controller: true,
          kind: 'Job',
          name: 'job1',
          namespace: 'namespace1',
        },
      ],
    },
  } as unknown as V1Pod);
  const factory = new PodsResourceFactory(contextsManager);
  expect(factory.restartObject).toBeDefined();

  await factory.restartObject(kubeconfig, 'pod1', 'namespace1');

  expect(contextsManager.restartObject).toHaveBeenCalledWith('Job', 'job1', 'namespace1');
});

test('restartObject with a pod managed by a Deployment deletes the pod', async () => {
  const apiClientMock = {
    readNamespacedPod: vi.fn(),
    deleteNamespacedPod: vi.fn(),
    createNamespacedPod: vi.fn(),
  } as unknown as CoreV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.readNamespacedPod).mockResolvedValue({
    metadata: {
      name: 'pod1',
      namespace: 'namespace1',
      creationTimestamp: new Date(),
      ownerReferences: [
        {
          controller: true,
          kind: 'Deployment',
          name: 'deployment1',
          namespace: 'namespace1',
        },
      ],
    },
  } as unknown as V1Pod);
  const factory = new PodsResourceFactory(contextsManager);
  expect(factory.restartObject).toBeDefined();

  await factory.restartObject(kubeconfig, 'pod1', 'namespace1');

  expect(apiClientMock.deleteNamespacedPod).toHaveBeenCalledWith({ name: 'pod1', namespace: 'namespace1' });
});
