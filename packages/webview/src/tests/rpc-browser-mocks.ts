/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import { vi } from 'vitest';
import * as svelte from 'svelte';
import type { RpcChannel } from '@kubernetes-dashboard/rpc';
import { RpcBrowser } from '@kubernetes-dashboard/rpc';

export class RpcBrowserMocks {
  #handlers: Map<string, Set<(value: unknown) => void>> = new Map();

  reset(): void {
    this.#handlers.clear();

    const rpcBrowserOnMock = vi.fn<RpcBrowser['on']>().mockImplementation((channel, handler) => {
      const channelName = channel.name;
      if (!this.#handlers.has(channelName)) {
        this.#handlers.set(channelName, new Set());
      }
      this.#handlers.get(channelName)!.add(handler as (value: unknown) => void);

      return { dispose: vi.fn() };
    });

    const mockRpcBrowser = {
      on: rpcBrowserOnMock,
    } as unknown as RpcBrowser;

    const nextMock = vi.isMockFunction(svelte.getContext)
      ? vi.mocked(svelte.getContext)?.getMockImplementation()
      : undefined;

    vi.spyOn(svelte, 'getContext').mockImplementation(key => {
      if (key === RpcBrowser) {
        return mockRpcBrowser;
      } else if (nextMock) {
        return nextMock(key);
      } else {
        throw new Error(`not supported mock in context: ${key}`);
      }
    });
  }

  fire<T>(channel: RpcChannel<T>, value: T): void {
    const handlers = this.#handlers.get(channel.name);
    if (handlers) {
      handlers.forEach(handler => handler(value));
    }
  }
}
