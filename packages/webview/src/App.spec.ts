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
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { AvailableContextsInfo, CurrentContextInfo } from '@kubernetes-dashboard/channels';
import App from './App.svelte';
import NoContextPage from './component/dashboard/NoContextPage.svelte';
import NoSelectedContextPage from './component/dashboard/NoSelectedContextPage.svelte';
import * as svelte from 'svelte';
import type { WebviewApi } from '@podman-desktop/webview-api';
import AppWithContext from '/@/AppWithContext.svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock(import('/@/component/dashboard/NoContextPage.svelte'));
vi.mock(import('/@/component/dashboard/NoSelectedContextPage.svelte'));
vi.mock(import('/@/AppWithContext.svelte'));
vi.mock(import('/@/component/connection/CurrentContextConnectionBadge.svelte'));
vi.mock(import('/@/component/connection/CheckConnection.svelte'));

const statesMocks = new StatesMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

const webviewApiMock = {
  getState: vi.fn(),
  postMessage: vi.fn(),
  setState: vi.fn(),
} as unknown as WebviewApi;

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();

  vi.spyOn(svelte, 'getContext').mockImplementation(key => {
    if (key === 'WebviewApi') {
      return webviewApiMock;
    }
  });

  statesMocks.reset();
  currentContextMock = new FakeStateObject();
  availableContextsMock = new FakeStateObject();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
});

afterEach(() => {
  vi.useRealTimers();
});

test('dashboard with no context', async () => {
  currentContextMock.setData({
    contextName: undefined,
  });
  availableContextsMock.setData({
    contextNames: [],
  });
  render(App);
  await vi.advanceTimersByTimeAsync(600);
  expect(NoContextPage).toHaveBeenCalled();
  expect(NoSelectedContextPage).not.toHaveBeenCalled();
  expect(AppWithContext).not.toHaveBeenCalled();
});

test('dashboard with two contexts, no current context', async () => {
  currentContextMock.setData({
    contextName: undefined,
  });
  availableContextsMock.setData({
    contextNames: ['context1', 'context2'],
  });
  render(App);
  await vi.advanceTimersByTimeAsync(600);
  expect(NoContextPage).not.toHaveBeenCalled();
  expect(NoSelectedContextPage).toHaveBeenCalled();
  expect(AppWithContext).not.toHaveBeenCalled();
});

test('dashboard with two contexts, one current context', async () => {
  currentContextMock.setData({
    contextName: 'context1',
  });
  availableContextsMock.setData({
    contextNames: ['context1', 'context2'],
  });
  render(App);
  await vi.advanceTimersByTimeAsync(600);
  expect(NoContextPage).not.toHaveBeenCalled();
  expect(NoSelectedContextPage).not.toHaveBeenCalled();
  expect(AppWithContext).toHaveBeenCalled();
});
