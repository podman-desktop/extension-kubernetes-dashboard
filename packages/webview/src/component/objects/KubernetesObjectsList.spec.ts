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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { KubernetesObjectUIHelper } from './kubernetes-object-ui-helper';
import { DependencyMocks } from '../../tests/dependency-mocks';
import { render, screen } from '@testing-library/svelte';
import KubernetesObjectsListSpec from './KubernetesObjectsListSpec.svelte';
import type { UpdateResourceOptions, UpdateResourceInfo, CurrentContextInfo, ContextsApi } from '@kubernetes-dashboard/channels';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import * as uiSvelte from '@podman-desktop/ui-svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_CONTEXTS } from '@kubernetes-dashboard/channels';

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

vi.mock(import('/@/component/connection/CurrentContextConnectionBadge.svelte'));
vi.mock(import('./NamespaceDropdown.svelte'));

const dependencyMocks = new DependencyMocks();
const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

let updateResourceMock: FakeStateObject<UpdateResourceInfo, UpdateResourceOptions>;
let currentContextMock: FakeStateObject<CurrentContextInfo, void>;

let user: UserEvent;

beforeEach(() => {
  vi.useFakeTimers();
  user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });

  vi.resetAllMocks();

  updateResourceMock = new FakeStateObject();
  currentContextMock = new FakeStateObject();

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);
  dependencyMocks.mock(KubernetesObjectUIHelper);

  statesMocks.reset();
  statesMocks.mock<UpdateResourceInfo, UpdateResourceOptions>('stateUpdateResourceInfoUI', updateResourceMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    deleteObjects: vi.fn(),
  } as unknown as ContextsApi);
});

afterEach(() => {
  vi.useRealTimers();
});

test('empty screen because of no resource', async () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  updateResourceMock.setData({
    resources: [
      // resources subscribed from this component
      {
        contextName: undefined,
        resourceName: 'seals',
        items: [], // no resource
      },
      // other resources, subscribed from some other components
      {
        contextName: 'ctx2',
        resourceName: 'seals',
        items: [{ metadata: { name: 'podman' } }],
      },
      {
        contextName: undefined,
        resourceName: 'dolphin',
        items: [{ metadata: { name: 'flipper' } }],
      },
    ],
  });

  render(KubernetesObjectsListSpec);

  // title is displayed (through NavPage)
  screen.getByRole('region', { name: 'Seals' });

  expect(updateResourceMock.subscribe).toHaveBeenCalledWith({
    contextName: undefined,
    resourceName: 'seals',
  });

  // emptySnippet is displayed after throttle delay
  await vi.waitFor(() => {
    screen.getByText('No Seals');
  });

  expect(uiSvelte.FilteredEmptyScreen).not.toHaveBeenCalled();
});

describe('resources exist', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    updateResourceMock.setData({
      resources: [
        // resources subscribed from this component
        {
          contextName: undefined,
          resourceName: 'seals',
          items: [{ metadata: { name: 'podman' } }], // no resource
        },
        // other resources, subscribed from some other components
        {
          contextName: 'ctx2',
          resourceName: 'seals',
          items: [{ metadata: { name: 'podman2' } }],
        },
        {
          contextName: undefined,
          resourceName: 'dolphin',
          items: [{ metadata: { name: 'flipper' } }],
        },
      ],
    });
  });

  test('list of resources', () => {
    render(KubernetesObjectsListSpec);

    expect(updateResourceMock.subscribe).toHaveBeenCalledWith({
      contextName: undefined,
      resourceName: 'seals',
    });
    expect(screen.queryByText('No Seals')).toBeNull();

    expect(uiSvelte.Table).toHaveBeenCalled();
    const props = vi.mocked(uiSvelte.Table).mock.calls[0][1];
    expect(props.data).toHaveLength(1);
    // get data transformed by the `transformer`
    expect(props.data[0]).toEqual({ name: 'podman' });

    expect(uiSvelte.FilteredEmptyScreen).not.toHaveBeenCalled();
  });

  test('list of resources when search matches resource', async () => {
    vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper)).findMatchInLeaves.mockImplementation(() => true);

    render(KubernetesObjectsListSpec);

    const element = screen.getByRole('textbox');
    await user.type(element, 'podman');

    expect(screen.queryByText('No Seals')).toBeNull();

    expect(uiSvelte.Table).toHaveBeenCalled();
    const props = vi.mocked(uiSvelte.Table).mock.calls[0][1];
    expect(props.data).toHaveLength(1);
    // get data transformed by the `transformer`
    expect(props.data[0]).toEqual({ name: 'podman' });

    expect(uiSvelte.FilteredEmptyScreen).not.toHaveBeenCalled();
  });

  test('list of resources when search does not match resource', async () => {
    vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper)).findMatchInLeaves.mockImplementation(() => false);

    render(KubernetesObjectsListSpec);

    const element = screen.getByRole('textbox');
    await user.type(element, 'podman');

    expect(screen.queryByText('No Seals')).toBeNull();

    expect(uiSvelte.Table).toHaveBeenCalled();
    const props = vi.mocked(uiSvelte.Table).mock.calls[0][1];
    expect(props.data).toHaveLength(0);

    expect(uiSvelte.FilteredEmptyScreen).toHaveBeenCalled();
  });
});
