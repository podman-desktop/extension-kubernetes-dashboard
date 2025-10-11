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
import { Streams } from '/@/stream/streams';
import type { StreamObject } from '/@/stream/util/stream-object';

/** Build mocks for streams injected in context via inversify
 *
 * To be used for unit tests
 *
 * ```
 *  const streamMocks = new StreamsMocks();
 *  const streamPodTerminalsMock = new FakeStreamObject<PodTerminalChunk>();
 *
 *  beforeEach(() => {
 *    vi.resetAllMocks();
 *    streamMocks.reset();
 *    streamMocks.mock<PodTerminalChunk>('streamPodTerminals', streamPodTerminalsMock);
 *  });
 *
 *  test('test with states', () => {
 *    render(...);
 *
 *    streamPodTerminalsMock.sendData({
 *      podName: 'pod1',
 *      namespace: 'ns1',
 *      containerName: 'container1',
 *      channel: 'stdout',
 *      data: Buffer.from('data1'),
 *    });
 *  });
 * ```
 */
export class StreamsMocks {
  #streamsMocks: Map<string, StreamObject<unknown>> = new Map();
  #streamsProperties = Object.getOwnPropertyNames(Streams.prototype).filter(property => property !== 'constructor');

  reset(): void {
    this.#streamsMocks.clear();
    const nextMock = vi.isMockFunction(svelte.getContext)
      ? vi.mocked(svelte.getContext)?.getMockImplementation()
      : undefined;
    vi.spyOn(svelte, 'getContext').mockImplementation(key => {
      if (key === Streams) {
        return this.automock();
      } else if (nextMock) {
        return nextMock(key);
      } else {
        throw new Error(`not supported mock in context: ${String(key)}`);
      }
    });
  }

  public mock<T>(identifier: string, streamObject: StreamObject<T>): void {
    assert(
      this.#streamsProperties.includes(identifier),
      `${identifier} is not a known property of Streams. Must be one of ${this.#streamsProperties.join(', ')}`,
    );
    this.#streamsMocks.set(identifier, streamObject);
  }

  private automock(): Streams {
    const result = this.#streamsProperties.reduce((prev, curr) => {
      if (this.#streamsMocks.has(curr)) {
        prev[curr] = this.#streamsMocks.get(curr);
      }
      return prev;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);
    return result;
  }
}
