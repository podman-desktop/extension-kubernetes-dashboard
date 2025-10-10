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

import { EndpointSlicesResourceFactory } from '/@/resources/endpoint-slices-resource-factory';
import { IngressesResourceFactory } from '/@/resources/ingresses-resource-factory';
import type { ResourceFactory } from '/@/resources/resource-factory';
import { RoutesResourceFactory } from '/@/resources/routes-resource-factory';
import { ContextsManager } from './contexts-manager';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { V1EndpointSlice, V1Ingress } from '@kubernetes/client-node';
import type { V1Route, Endpoint } from '@kubernetes-dashboard/channels';

class TestContextsManager extends ContextsManager {
  override getResourceFactories(): ResourceFactory[] {
    return [
      new EndpointSlicesResourceFactory(this),
      new IngressesResourceFactory(this),
      new RoutesResourceFactory(this),
    ];
  }
}

describe('ContextsManager', () => {
  let manager: TestContextsManager;

  beforeEach(() => {
    manager = new TestContextsManager();
  });

  test.each<{
    name: string;
    endpoints: V1EndpointSlice[];
    ingresses: V1Ingress[];
    routes: V1Route[];
    expected: Endpoint[];
  }>([
    {
      name: 'with no endpoints',
      endpoints: [],
      ingresses: [],
      routes: [],
      expected: [],
    },
    {
      name: 'with one endpoint targeting the pod and no ingress/route',
      endpoints: [
        {
          metadata: {
            name: 'pod1-abcdef',
            namespace: 'ns1',
            ownerReferences: [
              {
                apiVersion: 'v1',
                uid: '123',
                controller: true,
                kind: 'Service',
                name: 'svc1',
              },
            ],
          },
          addressType: 'IPV4',
          endpoints: [
            {
              addresses: ['10.0.0.1'],
              targetRef: {
                name: 'pod1',
                namespace: 'ns1',
                kind: 'Pod',
              },
            },
          ],
        },
      ],
      ingresses: [],
      routes: [],
      expected: [],
    },
    {
      name: 'with one endpoint targeting the pod and an ingress trageting the service',
      endpoints: [
        {
          metadata: {
            name: 'pod1-abcdef',
            namespace: 'ns1',
            ownerReferences: [
              {
                apiVersion: 'v1',
                uid: '123',
                controller: true,
                kind: 'Service',
                name: 'svc1',
              },
            ],
          },
          addressType: 'IPV4',
          endpoints: [
            {
              addresses: ['10.0.0.1'],
              targetRef: {
                name: 'pod1',
                namespace: 'ns1',
                kind: 'Pod',
              },
            },
          ],
        },
      ],
      ingresses: [
        {
          metadata: {
            name: 'ingress1',
            namespace: 'ns1',
          },
          spec: {
            rules: [
              {
                host: 'example.com',
                http: {
                  paths: [
                    {
                      pathType: 'Prefix',
                      path: '/subpath',
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
        },
      ],
      routes: [],
      expected: [
        {
          contextName: 'ctx1',
          targetKind: 'Pod',
          targetName: 'pod1',
          targetNamespace: 'ns1',
          inputKind: 'Ingress',
          inputName: 'ingress1',
          url: 'http://example.com/subpath',
        },
      ],
    },
    {
      name: 'with one endpoint targeting the pod and a route trageting the service',
      endpoints: [
        {
          metadata: {
            name: 'pod1-abcdef',
            namespace: 'ns1',
            ownerReferences: [
              {
                apiVersion: 'v1',
                uid: '123',
                controller: true,
                kind: 'Service',
                name: 'svc1',
              },
            ],
          },
          addressType: 'IPV4',
          endpoints: [
            {
              addresses: ['10.0.0.1'],
              targetRef: {
                name: 'pod1',
                namespace: 'ns1',
                kind: 'Pod',
              },
            },
          ],
        },
      ],
      routes: [
        {
          metadata: {
            name: 'route1',
            namespace: 'ns1',
          },
          spec: {
            tls: {
              insecureEdgeTerminationPolicy: 'Allow',
              termination: 'Edge',
            },
            to: {
              kind: 'Service',
              name: 'svc1',
              weight: 100,
            },
            host: 'example.com',
            wildcardPolicy: 'None',
          },
        },
      ],
      ingresses: [],
      expected: [
        {
          contextName: 'ctx1',
          targetKind: 'Pod',
          targetName: 'pod1',
          targetNamespace: 'ns1',
          inputKind: 'Route',
          inputName: 'route1',
          url: 'https://example.com',
        },
      ],
    },
  ])('getEndpoints $name', ({ endpoints, ingresses, routes, expected }) => {
    vi.spyOn(manager, 'searchByTargetRef').mockImplementation(kind => {
      if (kind === 'EndpointSlice') {
        return endpoints;
      } else if (kind === 'Ingress') {
        return ingresses;
      } else if (kind === 'Route') {
        return routes;
      }
      return [];
    });
    const result = manager.getEndpoints('ctx1', 'Pod', 'pod1', 'ns1');
    expect(result).toEqual(expected);
  });
});
