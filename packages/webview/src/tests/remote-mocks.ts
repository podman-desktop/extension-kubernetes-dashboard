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

import { assert, vi } from 'vitest';
import * as svelte from 'svelte';
import { Remote } from '../remote/remote';
import type { RpcChannel } from '@kubernetes-dashboard/rpc';

/** Build mocks for Remote injected in context via inversify
 *
 * To be used for unit tests
 *
 * Usage:
 *
 * ```
 * const remoteMocks = new RemoteMocks();
 *
 *  beforeEach(() => {
 *    vi.resetAllMocks();
 *
 *    remoteMocks.reset();
 *    remoteMocks.mock(API_CONTEXTS, {
 *      refreshContextState: vi.fn(),
 *    } as unknown as ContextsApi);
 *
 *  test('test', () => {
 *    vi.mocked(remoteMocks.get(API_CONTEXTS).refreshContextState).mockResolvedValue(undefined);
 *    ...
 *    expect(remoteMocks.get(API_CONTEXTS).refreshContextState).toHaveBeenCalled();
 *  });
 * ```
 */
export class RemoteMocks {
  #mocks: Map<RpcChannel<unknown>, unknown> = new Map();

  reset(): void {
    this.#mocks.clear();
    const remoteMock: Remote = {
      getProxy: vi.fn(),
    };
    const nextMock = vi.isMockFunction(svelte.getContext)
      ? vi.mocked(svelte.getContext)?.getMockImplementation()
      : undefined;
    vi.spyOn(svelte, 'getContext').mockImplementation(key => {
      if (key === Remote) {
        return remoteMock;
      } else if (nextMock) {
        return nextMock(key);
      } else {
        throw new Error(`not supported mock in context: ${key}`);
      }
    });

    vi.mocked(remoteMock.getProxy).mockImplementation(obj => {
      assert(this.#mocks.has(obj), `${obj} is not mocked`);
      return this.#mocks.get(obj);
    });
  }

  mock<T>(serviceIdentifier: RpcChannel<T>, mock: T): void {
    this.#mocks.set(serviceIdentifier, mock);
  }

  get<T>(serviceIdentifier: RpcChannel<T>): T {
    assert(this.#mocks.has(serviceIdentifier));
    return this.#mocks.get(serviceIdentifier) as T;
  }
}
