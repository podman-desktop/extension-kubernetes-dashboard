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

import { render } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import NodeDetails from './NodeDetails.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type {
  ResourceDetailsInfo,
  ResourceDetailsOptions,
  ResourceEventsInfo,
  ResourceEventsOptions,
} from '@kubernetes-dashboard/channels';
import { NodeHelper } from './node-helper';
import { Navigator } from '/@/navigation/navigator';
import { router } from 'tinro';
import { tick } from 'svelte';
import type { NodeUI } from './NodeUI';
import * as svelte from 'svelte';
import NodeDetailsSummary from '/@/component/nodes/NodeDetailsSummary.svelte';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';
import type { CurrentContextInfo } from '@podman-desktop/kubernetes-dashboard-extension-api';

vi.mock(import('./NodeDetailsSummary.svelte'));
const dependencyMocks = new DependencyMocks();
const statesMocks = new StatesMocks();

let resourceDetailsMock: FakeStateObject<ResourceDetailsInfo, ResourceDetailsOptions>;
let resourceEventsMock: FakeStateObject<ResourceEventsInfo, ResourceEventsOptions>;
let currentContextMock: FakeStateObject<CurrentContextInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  resourceDetailsMock = new FakeStateObject();
  resourceEventsMock = new FakeStateObject();
  currentContextMock = new FakeStateObject();

  vi.spyOn(svelte, 'getContext').mockImplementation(() => {});

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);
  dependencyMocks.mock(NodeHelper);
  dependencyMocks.mock(KubernetesObjectUIHelper);

  statesMocks.reset();
  statesMocks.mock<ResourceDetailsInfo, ResourceDetailsOptions>('stateResourceDetailsInfoUI', resourceDetailsMock);
  statesMocks.mock<ResourceEventsInfo, ResourceEventsOptions>('stateResourceEventsInfoUI', resourceEventsMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
});

vi.mock(import('/@/component/nodes/NodeDetailsSummary.svelte'));

test('node exists', async () => {
  vi.mocked(dependencyMocks.get(NodeHelper).getNodeUI).mockReturnValue({
    name: 'node1',
    status: 'Ready',
  } as NodeUI);
  currentContextMock.setData({
    contextName: 'ctx1',
    namespace: 'ns1',
  });
  resourceDetailsMock.setData({
    resources: [
      // resources subscribed from this component
      {
        contextName: 'ctx1',
        resourceName: 'nodes',
        name: 'node1',
        details: {
          metadata: {
            name: 'node1',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'node1',
        details: {
          metadata: {
            name: 'node1',
          },
        },
      },
      {
        contextName: 'ctx1',
        resourceName: 'dolphin',
        name: 'flipper',
        namespace: 'ns1',
        details: {
          metadata: {
            name: 'flipper',
            namespace: 'ns1',
          },
        },
      },
    ],
  });
  router.goto('http://localhost:3000');
  render(NodeDetails, { name: 'node1' });
  router.goto('summary');
  await tick();

  await vi.waitFor(() => {
    expect(NodeDetailsSummary).toHaveBeenCalled();
  });
});
