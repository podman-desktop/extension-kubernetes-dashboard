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

import { assert, expect, test, vi } from 'vitest';

import { listenActiveResourcesCount } from './active-resources-count-listen';
import { getContext } from 'svelte';
import type { RpcBrowser } from '/@common/rpc/rpc';
import type { DashboardApi } from '/@common/interface/dashboard-api';

vi.mock('svelte');

test('get initial and updated values', async () => {
  const counts = [
    {
      contextName: 'ctx1',
      resourceName: 'resource1',
      count: 1,
    },
    {
      contextName: 'ctx2',
      resourceName: 'resource1',
      count: 2,
    },
    {
      contextName: 'ctx2',
      resourceName: 'resource2',
      count: 3,
    },
  ];
  const rpcBrowserMock = {
    on: vi.fn(),
    getProxy: vi.fn(),
  } as unknown as RpcBrowser;
  vi.mocked(getContext).mockReturnValue(rpcBrowserMock);
  const proxy: DashboardApi = {
    getActiveResourcesCount: vi.fn(),
  };
  vi.mocked(rpcBrowserMock.getProxy).mockReturnValue(proxy);
  vi.mocked(proxy.getActiveResourcesCount).mockResolvedValueOnce(counts);

  const callback = vi.fn();
  const result = await listenActiveResourcesCount(callback);
  expect(result).not.toBeUndefined();
  expect(callback).toHaveBeenCalledWith(counts);

  const newCounts = [
    {
      contextName: 'ctx1',
      resourceName: 'resource1',
      count: 1,
    },
  ];
  vi.mocked(proxy.getActiveResourcesCount).mockResolvedValueOnce(newCounts);

  callback.mockClear();

  const cb = vi.mocked(rpcBrowserMock.on).mock.lastCall?.[1];
  assert(cb);
  cb(undefined);
  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(newCounts);
  });
});
