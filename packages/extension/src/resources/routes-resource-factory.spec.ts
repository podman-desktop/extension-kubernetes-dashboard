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

import type { MockedFunction } from 'vitest';
import { expect, test, vi } from 'vitest';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import type { CustomObjectsApi, KubeConfig, KubernetesListObject } from '@kubernetes/client-node';
import type { V1Route } from '/@common/model/openshift-types';
import { RoutesResourceFactory } from './routes-resource-factory';

const makeApiClientMock = vi.fn() as MockedFunction<KubeConfig['makeApiClient']>;

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      makeApiClient: makeApiClientMock,
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

const route1 = {
  metadata: {
    name: 'route1',
    namespace: 'ns1',
  },
  spec: {
    to: {
      kind: 'Service',
      name: 'svc1',
    },
  },
} as unknown as V1Route;

const route2 = {
  metadata: {
    name: 'route2',
    namespace: 'ns1',
  },
  spec: {
    to: {
      kind: 'Service',
      name: 'svc2',
    },
  },
} as unknown as V1Route;

test('searchRoutesByTargetRef returns the correct routes', async () => {
  const apiClientMock = {
    listNamespacedCustomObject: vi.fn(),
  } as unknown as CustomObjectsApi;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.listNamespacedCustomObject).mockResolvedValue({
    items: [route1, route2],
  } as unknown as KubernetesListObject<V1Route>);
  const factory = new RoutesResourceFactory();
  const ingresses = await factory.searchRoutesByTargetRef(kubeconfig, {
    kind: 'Service',
    name: 'svc1',
    namespace: 'ns1',
  });
  expect(ingresses).toEqual([route1]);
});
