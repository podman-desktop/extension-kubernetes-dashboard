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
import { EndpointSlicesResourceFactory } from './endpoint-slices-resource-factory';
import type { DiscoveryV1Api, KubeConfig, V1EndpointSlice, V1EndpointSliceList } from '@kubernetes/client-node';

const makeApiClientMock = vi.fn() as MockedFunction<KubeConfig['makeApiClient']>;

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      makeApiClient: makeApiClientMock,
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

const endpointSlice1 = {
  metadata: {
    name: 'pod1-abcdef',
    namespace: 'ns1',
  },
  endpoints: [
    {
      targetRef: {
        name: 'pod1',
        namespace: 'ns1',
        kind: 'Pod',
      },
    },
  ],
} as unknown as V1EndpointSlice;

const endpointSlice2 = {
  metadata: {
    name: 'pod2-abcdef',
    namespace: 'ns1',
  },
  endpoints: [],
} as unknown as V1EndpointSlice;

const endpointSlice3 = {
  metadata: {
    name: 'pod3-abcdef',
    namespace: 'ns1',
  },
  endpoints: [
    {
      targetRef: {
        name: 'pod3',
        namespace: 'ns1',
        kind: 'Pod',
      },
    },
  ],
} as unknown as V1EndpointSlice;

test('searchEndpointSlicesByTargetRef returns the correct endpoint slices', async () => {
  const apiClientMock = {
    listNamespacedEndpointSlice: vi.fn(),
  } as unknown as DiscoveryV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.listNamespacedEndpointSlice).mockResolvedValue({
    items: [endpointSlice1, endpointSlice2, endpointSlice3],
  } as unknown as V1EndpointSliceList);
  const factory = new EndpointSlicesResourceFactory();
  const endpointSlices = await factory.searchEndpointSlicesByTargetRef(kubeconfig, {
    kind: 'Pod',
    name: 'pod1',
    namespace: 'ns1',
  });
  expect(endpointSlices).toEqual([endpointSlice1]);
});
