/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

import type { AppsV1Api, KubeConfig, V1Deployment } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { DeploymentsResourceFactory } from './deployments-resource-factory.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';

const kubeConfigMock = {
  makeApiClient: vi.fn(),
} as unknown as KubeConfig;

const kubeconfig = {
  getKubeConfig: () => kubeConfigMock,
} as unknown as KubeConfigSingleContext;

beforeEach(() => {
  vi.resetAllMocks();
});

test('deployment with replica=0 is not active', () => {
  const factory = new DeploymentsResourceFactory();
  expect(factory.isActive).toBeDefined();
  expect(
    factory.isActive!({
      spec: {
        replicas: 0,
      },
    } as V1Deployment),
  ).toBeFalsy();
});

test('deployment with replica=1 is active', () => {
  const factory = new DeploymentsResourceFactory();
  expect(factory.isActive).toBeDefined();
  expect(
    factory.isActive!({
      spec: {
        replicas: 1,
      },
    } as V1Deployment),
  ).toBeTruthy();
});

test('deployment with replica undefined is not active', () => {
  const factory = new DeploymentsResourceFactory();
  expect(factory.isActive).toBeDefined();
  expect(factory.isActive!({} as V1Deployment)).toBeFalsy();
});

test('scaleObject updates deployment scale subresource', async () => {
  const apiClientMock = {
    patchNamespacedDeploymentScale: vi.fn().mockResolvedValue(undefined),
  } as unknown as AppsV1Api;
  vi.mocked(kubeConfigMock.makeApiClient).mockReturnValue(apiClientMock);

  const factory = new DeploymentsResourceFactory();

  expect(factory.scaleObject).toBeDefined();
  await factory.scaleObject!(kubeconfig, 'deployment1', 'namespace1', 4);

  expect(apiClientMock.patchNamespacedDeploymentScale).toHaveBeenCalledWith({
    name: 'deployment1',
    namespace: 'namespace1',
    body: [{ op: 'add', path: '/spec/replicas', value: 4 }],
  });
});
