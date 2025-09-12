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
import type { KubeConfig, NetworkingV1Api, V1EndpointSliceList, V1Ingress } from '@kubernetes/client-node';
import { IngressesResourceFactory } from './ingresses-resource-factory';

const makeApiClientMock = vi.fn() as MockedFunction<KubeConfig['makeApiClient']>;

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      makeApiClient: makeApiClientMock,
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

const ingress1 = {
  metadata: {
    name: 'ingress1',
    namespace: 'ns1',
  },
  spec: {
    defaultBackend: {
      service: {
        name: 'svc1',
      },
    },
  },
} as unknown as V1Ingress;

const ingress2 = {
  metadata: {
    name: 'ingress2',
    namespace: 'ns1',
  },
  spec: {
    defaultBackend: {
      service: {
        name: 'svc2',
      },
    },
    rules: [
      {
        http: {
          paths: [
            {
              backend: {
                service: {
                  name: 'svc3',
                },
              },
            },
          ],
        },
      },
    ],
  },
} as unknown as V1Ingress;

const ingress3 = {
  metadata: {
    name: 'ingress3',
    namespace: 'ns1',
  },
  spec: {
    defaultBackend: {
      service: {
        name: 'svc1',
      },
    },
    rules: [
      {
        http: {
          paths: [
            {
              backend: {
                service: {
                  name: 'svc1',
                },
              },
            },
          ],
        },
      },
    ],
  },
} as unknown as V1Ingress;

test('searchIngressesByTargetRef returns the correct ingresses', async () => {
  const apiClientMock = {
    listNamespacedIngress: vi.fn(),
  } as unknown as NetworkingV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.listNamespacedIngress).mockResolvedValue({
    items: [ingress1, ingress2, ingress3],
  } as unknown as V1EndpointSliceList);
  const factory = new IngressesResourceFactory();
  const ingresses = await factory.searchIngressesByTargetRef(kubeconfig, {
    kind: 'Service',
    name: 'svc1',
    namespace: 'ns1',
  });
  expect(ingresses).toEqual([ingress1, ingress3]);
});

test('searchIngressesByTargetRef returns no ingress', async () => {
  const apiClientMock = {
    listNamespacedIngress: vi.fn(),
  } as unknown as NetworkingV1Api;
  makeApiClientMock.mockReturnValue(apiClientMock);
  vi.mocked(apiClientMock.listNamespacedIngress).mockResolvedValue({
    items: [ingress2],
  } as unknown as V1EndpointSliceList);
  const factory = new IngressesResourceFactory();
  const ingresses = await factory.searchIngressesByTargetRef(kubeconfig, {
    kind: 'Service',
    name: 'svc1',
    namespace: 'ns1',
  });
  expect(ingresses).toEqual([]);
});
