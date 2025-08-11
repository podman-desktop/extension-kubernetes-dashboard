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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DependencyMocks } from '../../tests/dependency-mocks';
import { render } from '@testing-library/svelte';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { StatesMocks } from '/@/tests/context-mocks';
import type { ResourceDetailsOptions } from '/@common/model/resource-details-options';
import type { ResourceDetailsInfo } from '/@common/model/resource-details-info';
import type { ResourceEventsInfo } from '/@common/model/resource-events-info';
import type { ResourceEventsOptions } from '/@common/model/resource-events-options';
import { Navigator } from '/@/navigation/navigator';
import KubernetesObjectDetailsSpec from './KubernetesObjectDetailsSpec.svelte';

vi.mock(import('@podman-desktop/ui-svelte'), async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('@podman-desktop/ui-svelte')>('@podman-desktop/ui-svelte');
  return {
    ...actual,
    Table: vi.fn(),
    TableColumn: vi.fn(),
    TableRow: vi.fn(),
    FilteredEmptyScreen: vi.fn(),
  };
});

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

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);

  statesMocks.reset();
  statesMocks.mock<ResourceDetailsInfo, ResourceDetailsOptions>('stateResourceDetailsInfoUI', resourceDetailsMock);
  statesMocks.mock<ResourceEventsInfo, ResourceEventsOptions>('stateResourceEventsInfoUI', resourceEventsMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
});

afterEach(() => {});

test('resource exists', () => {
  currentContextMock.setData({
    contextName: 'ctx1',
    namespace: 'ns1',
  });
  resourceDetailsMock.setData({
    resources: [
      // resources subscribed from this component
      {
        contextName: 'ctx1',
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
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

  const mock = vi.fn();
  render(KubernetesObjectDetailsSpec, {
    mock,
  });

  expect(mock).toHaveBeenCalledWith(
    {
      kind: 'Namespace',
      name: 'ns1',
      status: 'RUNNING',
    },
    {
      metadata: {
        name: 'ns1',
      },
    },
    [],
  );
});

test('resource and events exist', () => {
  currentContextMock.setData({
    contextName: 'ctx1',
    namespace: 'ns1',
  });
  resourceDetailsMock.setData({
    resources: [
      // resources subscribed from this component
      {
        contextName: 'ctx1',
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
            uid: '1234',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
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
              name: 'flipper-event',
            },
            involvedObject: {
              uid: '1234',
            },
          },
        ],
      },
    ],
  });

  const mock = vi.fn();
  render(KubernetesObjectDetailsSpec, {
    mock,
  });

  expect(mock).toHaveBeenCalledWith(
    {
      kind: 'Namespace',
      name: 'ns1',
      status: 'RUNNING',
    },
    {
      metadata: {
        name: 'ns1',
        uid: '1234',
      },
    },
    [
      {
        metadata: {
          name: 'flipper-event',
        },
        involvedObject: {
          uid: '1234',
        },
      },
    ],
  );
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
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
          },
        },
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'namespaces',
        name: 'ns1',
        details: {
          metadata: {
            name: 'ns1',
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

  const mock = vi.fn();
  render(KubernetesObjectDetailsSpec, {
    mock,
  });

  expect(mock).toHaveBeenCalledWith(
    {
      kind: 'Namespace',
      name: 'ns1',
      status: 'RUNNING',
    },
    {
      metadata: {
        name: 'ns1',
      },
    },
    [],
  );

  currentContextMock.setData({
    contextName: 'ctx2',
    namespace: 'ns1',
  });

  await vi.waitFor(() => {
    expect(dependencyMocks.get(Navigator).kubernetesResourcesURL).toHaveBeenCalledWith('Namespace');
  });
});
