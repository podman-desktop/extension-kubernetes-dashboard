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
import { States } from '/@/state/states';
import type { StateObject } from '/@/state/util/state-object.svelte';

/** Build mocks for dependencies and mocks injected in context via inversify
 *
 * To be used for unit tests
 *
 * ```
 *  const statesMocks = new StatesMocks();
 *  const currentContextMock = new FakeStateObject<CurrentContextInfo, void>();
 *
 *  beforeEach(() => {
 *    vi.resetAllMocks();
 *    statesMocks.reset();
 *    statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
 *  });
 *
 *  test('test with states', () => {
 *    currentContextMock.setData({
 *      contextName: 'ctx1',
 *    });
 *
 *    render(...);
 *
 *    expect(currentContextMock.subscribe).toHaveBeenCalled();
 *  });
 * ```
 */
export class StatesMocks {
  #stateMocks: Map<string, StateObject<unknown, unknown>> = new Map();
  #statesProperties = Object.getOwnPropertyNames(States.prototype).filter(property => property !== 'constructor');

  reset(): void {
    this.#stateMocks.clear();
    const nextMock = vi.isMockFunction(svelte.getContext)
      ? vi.mocked(svelte.getContext)?.getMockImplementation()
      : undefined;
    vi.spyOn(svelte, 'getContext').mockImplementation(key => {
      if (key === States) {
        return this.automock();
      } else if (nextMock) {
        return nextMock(key);
      } else {
        throw new Error(`not supported mock in context: ${String(key)}`);
      }
    });
  }

  public mock<T, U>(identifier: string, stateObject: StateObject<T, U>): void {
    assert(
      this.#statesProperties.includes(identifier),
      `${identifier} is not a known property of States. Must be one of ${this.#statesProperties.join(', ')}`,
    );
    this.#stateMocks.set(identifier, stateObject);
  }

  private automock(): States {
    const result = this.#statesProperties.reduce((prev, curr) => {
      if (this.#stateMocks.has(curr)) {
        prev[curr] = this.#stateMocks.get(curr);
      }
      return prev;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
    return result;
  }
}
