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

import { beforeEach, expect, test, vi } from 'vitest';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { render } from '@testing-library/svelte';
import type {
  ResourceDetailsOptions,
  ResourceDetailsInfo,
  ResourceEventsInfo,
  ResourceEventsOptions,
} from '@kubernetes-dashboard/channels';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { Navigator } from '/@/navigation/navigator';
import KubernetesObjectDetailsSpec from './KubernetesObjectDetailsSpec.svelte';
import NodeDetailsSummary from '/@/component/nodes/NodeDetailsSummary.svelte';
import * as svelte from 'svelte';
import { router } from 'tinro';
import { KubernetesObjectUIHelper } from './kubernetes-object-ui-helper';
import type { CurrentContextInfo } from '@podman-desktop/kubernetes-dashboard-extension-api';

vi.mock(import('/@/component/nodes/NodeDetailsSummary.svelte'));

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
  dependencyMocks.mock(KubernetesObjectUIHelper);

  statesMocks.reset();
  statesMocks.mock<ResourceDetailsInfo, ResourceDetailsOptions>('stateResourceDetailsInfoUI', resourceDetailsMock);
  statesMocks.mock<ResourceEventsInfo, ResourceEventsOptions>('stateResourceEventsInfoUI', resourceEventsMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
});

test('resource exists', async () => {
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
            uid: '1234',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'ns1',
        details: {
          metadata: {
            name: 'node1',
            uid: '1234',
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
            uid: '1235',
          },
        },
      },
    ],
  });

  router.goto('http://localhost:3000');
  render(KubernetesObjectDetailsSpec);
  router.goto('summary');
  await vi.waitFor(() => {
    expect(NodeDetailsSummary).toHaveBeenCalledWith(expect.anything(), {
      object: {
        metadata: {
          name: 'node1',
          uid: '1234',
        },
      },
      events: [],
    });
  });
});

test('resource and events exist', async () => {
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
            uid: '1234',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'ns1',
        details: {
          metadata: {
            name: 'node1',
            uid: '1234',
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
            uid: '1235',
          },
        },
      },
    ],
  });

  resourceEventsMock.setData({
    events: [
      {
        contextName: 'ctx1',
        uid: '1234',
        events: [
          {
            metadata: {
              name: 'node1-event',
            },
            involvedObject: {
              uid: '1234',
            },
          },
        ],
      },
    ],
  });

  router.goto('http://localhost:3000');
  render(KubernetesObjectDetailsSpec);
  router.goto('summary');

  await vi.waitFor(() => {
    expect(NodeDetailsSummary).toHaveBeenCalledWith(expect.anything(), {
      object: {
        metadata: {
          name: 'node1',
          uid: '1234',
        },
      },
      events: [
        {
          metadata: {
            name: 'node1-event',
          },
          involvedObject: {
            uid: '1234',
          },
        },
      ],
    });
  });
});

test('context change', async () => {
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
            uid: '1234',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'ns1',
        details: {
          metadata: {
            name: 'node1',
            uid: '1234',
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
            uid: '1235',
          },
        },
      },
    ],
  });

  router.goto('http://localhost:3000');
  render(KubernetesObjectDetailsSpec);
  router.goto('summary');

  currentContextMock.setData({
    contextName: 'ctx2',
    namespace: 'ns1',
  });

  await vi.waitFor(() => {
    expect(dependencyMocks.get(Navigator).kubernetesResourcesURL).toHaveBeenCalledWith('Node');
  });
});

test('resource deleted', async () => {
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
            uid: '1234',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'ns1',
        details: {
          metadata: {
            name: 'node1',
            uid: '1234',
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
            uid: '1235',
          },
        },
      },
    ],
  });

  router.goto('http://localhost:3000');
  render(KubernetesObjectDetailsSpec);
  router.goto('summary');

  resourceDetailsMock.setData({
    resources: [
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'nodes',
        name: 'ns1',
        details: {
          metadata: {
            name: 'node1',
            uid: '1234',
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
            uid: '1235',
          },
        },
      },
    ],
  });
  await vi.waitFor(() => {
    expect(dependencyMocks.get(Navigator).kubernetesResourcesURL).toHaveBeenCalledWith('Node');
  });
});
