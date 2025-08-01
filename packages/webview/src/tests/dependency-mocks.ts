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
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { Newable } from 'inversify';

/** Build mocks for dependencies injected in context via inversify
 *
 * To be used for unit tests
 *
 * Usage:
 *
 * ```
 *  const dependencyMocks = new DependencyMocks();
 *
 *  beforeEach(() => {
 *    vi.resetAllMocks();
 *    dependencyMocks.reset();
 *    dependencyMocks.mock(Class1);
 *    dependencyMocks.mock(Class2);
 *  });
 *
 *  test('test', () => {
 *    vi.mocked(dependencyMocks.get(Class1).class1Method).mockReturnValue(true);
 *    ...
 *    expect(dependencyMocks.get(Class2).class2Method).toBeCalled();
 *  });
 * ```
 */
export class DependencyMocks {
  #mocks: Map<Newable, unknown> = new Map();

  reset(): void {
    this.#mocks.clear();
    const dependencyAccessorMock: DependencyAccessor = {
      get: vi.fn(),
    } as unknown as DependencyAccessor;
    const nextMock = vi.isMockFunction(svelte.getContext)
      ? vi.mocked(svelte.getContext)?.getMockImplementation()
      : undefined;
    vi.spyOn(svelte, 'getContext').mockImplementation(key => {
      if (key === DependencyAccessor) {
        return dependencyAccessorMock;
      } else if (nextMock) {
        return nextMock(key);
      } else {
        throw new Error(`not supported mock in context: ${String(key)}`);
      }
    });

    vi.mocked(dependencyAccessorMock.get).mockImplementation(obj => {
      assert(this.#mocks.has(obj), `${obj} is not mocked`);
      return this.#mocks.get(obj);
    });
  }

  mock<T>(serviceIdentifier: Newable<T>): T {
    const mock = this.automock<T>(serviceIdentifier);
    this.#mocks.set(serviceIdentifier, mock);
    return mock;
  }

  get<T>(serviceIdentifier: Newable<T>): T {
    assert(this.#mocks.has(serviceIdentifier));
    return this.#mocks.get(serviceIdentifier) as T;
  }

  private automock<T>(serviceIdentifier: Newable<T>): T {
    const properties = Object.getOwnPropertyNames(serviceIdentifier.prototype).filter(
      property => property !== 'constructor',
    );
    return properties.reduce((prev, curr) => {
      prev[curr] = vi.fn();
      return prev;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
  }
}
