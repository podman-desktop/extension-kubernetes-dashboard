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

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import NamespaceDropdown from './NamespaceDropdown.svelte';
import { StatesMocks } from '/@/tests/context-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import type { ContextsHealthsInfo } from '/@common/model/contexts-healths-info';
import type { UpdateResourceInfo } from '/@common/model/update-resource-info';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_CONTEXTS } from '/@common/channels';
import type { ContextsApi } from '/@common/interface/contexts-api';

const firstNS = 'ns1';
const secondNS = 'ns2';
const thirdNS = 'ns3';

vi.mock('/@/stores/kubernetes-contexts-state');

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let contextsHealthsMock: FakeStateObject<ContextsHealthsInfo, void>;
let updateResourceMock: FakeStateObject<UpdateResourceInfo, void>;

beforeEach(() => {
  vi.clearAllMocks();

  currentContextMock = new FakeStateObject();
  contextsHealthsMock = new FakeStateObject();
  updateResourceMock = new FakeStateObject();

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    setCurrentNamespace: vi.fn(),
  } as unknown as ContextsApi);

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<ContextsHealthsInfo, void>('stateContextsHealthsInfoUI', contextsHealthsMock);
  statesMocks.mock<UpdateResourceInfo, void>('stateUpdateResourceInfoUI', updateResourceMock);

  currentContextMock.setData({
    contextName: 'context1',
    namespace: firstNS,
  });
  contextsHealthsMock.setData({
    healths: [
      {
        contextName: 'context1',
        reachable: true,
        checking: false,
        offline: false,
      },
      {
        contextName: 'context2',
        reachable: false,
        checking: false,
        offline: false,
      },
    ],
  });
  updateResourceMock.setData({
    resources: [
      {
        // this will be the one used by the component
        contextName: undefined,
        resourceName: 'namespaces',
        items: [
          {
            metadata: {
              name: firstNS,
            },
          },
          {
            metadata: {
              name: secondNS,
            },
          },
        ],
      },
      {
        // this one will be ignored by the component
        contextName: 'context2',
        resourceName: 'namespaces',
        items: [
          {
            metadata: {
              name: thirdNS,
            },
          },
        ],
      },
    ],
  });
});

test('Expect basic styling', async () => {
  render(NamespaceDropdown);

  await waitFor(() => expect(screen.queryByText('Namespace:')).toBeInTheDocument());

  const dropdown = screen.getByLabelText('Kubernetes Namespace');
  expect(dropdown).toBeInTheDocument();
  expect(dropdown).toHaveClass('w-56 max-w-56');
});

test('Expect namespaces are in the dropdown', async () => {
  render(NamespaceDropdown);

  await waitFor(() => expect(screen.queryByText(firstNS)).toBeInTheDocument());

  const dropdown = screen.getByRole('button');
  expect(dropdown).toBeInTheDocument();
  expect(dropdown.textContent).toContain(firstNS);

  // open the dropdown
  await fireEvent.click(dropdown);

  // first namespace is in the original button and in the dropdown
  const item1 = screen.getAllByRole('button', { name: new RegExp(`${firstNS}$`) });

  expect(item1.length).toEqual(2);

  // second namespace is also clickable
  const item2 = screen.getByRole('button', { name: secondNS });
  expect(item2).toBeInTheDocument();
});

test('Expect clicking works', async () => {
  render(NamespaceDropdown);

  await waitFor(() => expect(screen.queryByText(firstNS)).toBeInTheDocument());

  const dropdown = screen.getByRole('button');
  expect(dropdown).toBeInTheDocument();
  expect(dropdown.textContent).toContain(firstNS);

  // open the dropdown
  await fireEvent.click(dropdown);

  const item = screen.getByRole('button', { name: secondNS });
  expect(item).toBeInTheDocument();

  // select the new namspace
  await fireEvent.click(item);

  await waitFor(() => expect(remoteMocks.get(API_CONTEXTS).setCurrentNamespace).toHaveBeenCalledWith(secondNS));
});
