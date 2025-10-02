/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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
import Dashboard from './Dashboard.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { AvailableContextsInfo } from '/@common/model/available-contexts-info';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import { RemoteMocks } from '/@/tests/remote-mocks';
import type { SystemApi } from '/@common/interface/system-api';
import { API_SYSTEM } from '/@common/channels';
import NoContextPage from './NoContextPage.svelte';
import NoSelectedContextPage from './NoSelectedContextPage.svelte';
import DashboardResources from './DashboardResources.svelte';
import DashboardGuideCard from './DashboardGuideCard.svelte';

vi.mock(import('./NoContextPage.svelte'));
vi.mock(import('./NoSelectedContextPage.svelte'));
vi.mock(import('/@/component/connection/CurrentContextConnectionBadge.svelte'));
vi.mock(import('./DashboardResources.svelte'));
vi.mock(import('./DashboardGuideCard.svelte'));

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();
  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    openExternal: vi.fn(),
  } as unknown as SystemApi);

  statesMocks.reset();
  currentContextMock = new FakeStateObject();
  availableContextsMock = new FakeStateObject();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
});

test('dashboard with no context', async () => {
  currentContextMock.setData({
    contextName: undefined,
  });
  availableContextsMock.setData({
    contextNames: [],
  });
  render(Dashboard);
  expect(NoContextPage).toHaveBeenCalled();
  expect(NoSelectedContextPage).not.toHaveBeenCalled();
  expect(DashboardResources).not.toHaveBeenCalled();
  expect(DashboardGuideCard).not.toHaveBeenCalled();
});

test('dashboard with two contexts, no current context', async () => {
  currentContextMock.setData({
    contextName: undefined,
  });
  availableContextsMock.setData({
    contextNames: ['context1', 'context2'],
  });
  render(Dashboard);
  expect(NoContextPage).not.toHaveBeenCalled();
  expect(NoSelectedContextPage).toHaveBeenCalled();
  expect(DashboardResources).not.toHaveBeenCalled();
  expect(DashboardGuideCard).not.toHaveBeenCalled();
});

test('dashboard with two contexts, one current context', async () => {
  currentContextMock.setData({
    contextName: 'context1',
  });
  availableContextsMock.setData({
    contextNames: ['context1', 'context2'],
  });
  render(Dashboard);
  expect(NoContextPage).not.toHaveBeenCalled();
  expect(NoSelectedContextPage).not.toHaveBeenCalled();
  expect(DashboardResources).toHaveBeenCalled();
  expect(DashboardGuideCard).toHaveBeenCalled();
});
