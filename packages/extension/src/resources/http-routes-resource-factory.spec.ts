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

import type { KubeConfig } from '@kubernetes/client-node';
import type { V1HTTPRoute } from '@kubernetes-dashboard/channels';
import { expect, test, vi } from 'vitest';

import type { ContextsManager } from '/@/manager/contexts-manager';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import { HTTPRoutesResourceFactory } from '/@/resources/http-routes-resource-factory';

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      currentContext: 'ctx1',
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

const contextsManager: ContextsManager = {
  getResources: vi.fn(),
} as unknown as ContextsManager;

const httpRoute1 = {
  metadata: {
    name: 'httproute1',
    namespace: 'ns1',
  },
  spec: {
    rules: [
      {
        backendRefs: [
          {
            name: 'svc1',
          },
        ],
      },
    ],
  },
} as V1HTTPRoute;

const httpRoute2 = {
  metadata: {
    name: 'httproute2',
    namespace: 'ns1',
  },
  spec: {
    rules: [
      {
        backendRefs: [
          {
            kind: 'Service',
            name: 'svc2',
          },
        ],
      },
    ],
  },
} as V1HTTPRoute;

const httpRoute3 = {
  metadata: {
    name: 'httproute3',
    namespace: 'ns1',
  },
  spec: {
    rules: [
      {
        backendRefs: [
          {
            kind: 'Service',
            name: 'svc1',
            namespace: 'other-ns',
          },
        ],
      },
    ],
  },
} as V1HTTPRoute;

test('searchHTTPRoutesByTargetRef returns the correct httproutes', () => {
  vi.mocked(contextsManager.getResources).mockReturnValue([httpRoute1, httpRoute2, httpRoute3]);
  const factory = new HTTPRoutesResourceFactory(contextsManager);
  const httpRoutes = factory.searchHTTPRoutesByTargetRef(kubeconfig, {
    kind: 'Service',
    name: 'svc1',
    namespace: 'ns1',
  });
  expect(httpRoutes).toEqual([httpRoute1]);
});

test('searchHTTPRoutesByTargetRef returns no httproutes for non service targets', () => {
  vi.mocked(contextsManager.getResources).mockReturnValue([httpRoute1]);
  const factory = new HTTPRoutesResourceFactory(contextsManager);
  const httpRoutes = factory.searchHTTPRoutesByTargetRef(kubeconfig, {
    kind: 'Pod',
    name: 'pod1',
    namespace: 'ns1',
  });
  expect(httpRoutes).toEqual([]);
});
