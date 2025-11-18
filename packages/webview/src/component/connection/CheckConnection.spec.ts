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

import { render, screen } from '@testing-library/svelte';
import { assert, beforeEach, expect, test, vi } from 'vitest';

import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { type CurrentContextInfo, API_CONTEXTS, type ContextsApi } from '@kubernetes-dashboard/channels';
import CheckConnection from './CheckConnection.svelte';
import userEvent from '@testing-library/user-event';
import { RemoteMocks } from '/@/tests/remote-mocks';
import type { ContextsHealthsInfo } from '@podman-desktop/kubernetes-dashboard-extension-api';

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let contextsHealthsMock: FakeStateObject<ContextsHealthsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    refreshContextState: vi.fn(),
  } as unknown as ContextsApi);

  vi.mocked(remoteMocks.get(API_CONTEXTS).refreshContextState).mockResolvedValue(undefined);

  currentContextMock = new FakeStateObject();
  contextsHealthsMock = new FakeStateObject();

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<ContextsHealthsInfo, void>('stateContextsHealthsInfoUI', contextsHealthsMock);
});

test('button is displayed and active if current context is defined and is not reachable', async () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  contextsHealthsMock.setData({
    healths: [{ contextName: 'ctx1', reachable: false, checking: false, offline: false }],
  });

  render(CheckConnection);

  const button = screen.queryByRole('button');
  assert(button);
  expect(button).toHaveProperty('disabled', false);

  await userEvent.click(button);
  expect(remoteMocks.get(API_CONTEXTS).refreshContextState).toHaveBeenCalled();
});

test('button is not displayed if current context is defined and is reachable', async () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  contextsHealthsMock.setData({
    healths: [{ contextName: 'ctx1', reachable: true, checking: false, offline: false }],
  });

  render(CheckConnection);

  render(CheckConnection);
  expect(screen.queryByRole('button')).toBeNull();
});

test('button is not displayed if no current context', async () => {
  currentContextMock.setData({
    contextName: undefined,
  });

  render(CheckConnection);
  expect(screen.queryByRole('button')).toBeNull();
});

test('button is displayed and disabled if current context is defined, is not reacahble and is being checked', async () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  contextsHealthsMock.setData({
    healths: [{ contextName: 'ctx1', reachable: false, checking: true, offline: false }],
  });

  render(CheckConnection);
  const button = screen.getByRole('button');
  expect(button).toHaveProperty('disabled', true);
});
