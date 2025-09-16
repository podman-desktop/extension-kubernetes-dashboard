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
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import type { KubeConfig } from '@kubernetes/client-node';
import type { V1Route } from '/@common/model/openshift-types';
import { RoutesResourceFactory } from './routes-resource-factory';
import type { ContextsManager } from '/@/manager/contexts-manager';

const kubeconfig: KubeConfigSingleContext = {
  getKubeConfig: () =>
    ({
      currentContext: 'ctx1',
    }) as unknown as KubeConfig,
} as unknown as KubeConfigSingleContext;

const contextsManager: ContextsManager = {
  getResources: vi.fn(),
} as unknown as ContextsManager;

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
  vi.mocked(contextsManager.getResources).mockReturnValue([route1, route2]);
  const factory = new RoutesResourceFactory(contextsManager);
  const ingresses = factory.searchRoutesByTargetRef(kubeconfig, {
    kind: 'Service',
    name: 'svc1',
    namespace: 'ns1',
  });
  expect(ingresses).toEqual([route1]);
});
