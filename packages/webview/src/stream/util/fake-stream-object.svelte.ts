/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

import { type IDisposable } from '@kubernetes-dashboard/channels';
import { SvelteMap } from 'svelte/reactivity';
import type { StreamObject } from './stream-object';

/**
 * Fake StreamObject for tests.
 * Supports multiple subscriptions keyed by podName/namespace/containerName.
 */
export class FakeStreamObject<T, U> implements StreamObject<T, U> {
  #callbacks = new SvelteMap<string, (data: T) => void>();

  async subscribe(
    podName: string,
    namespace: string,
    containerName: string,
    options: U,
    callback: (data: T) => void,
  ): Promise<IDisposable> {
    const key = `${podName}/${namespace}/${containerName}`;
    this.#callbacks.set(key, callback);
    return {
      dispose: () => {
        this.#callbacks.delete(key);
      },
    } as IDisposable;
  }

  /**
   * Send data to the callback registered for the matching podName/namespace/containerName.
   * The data object must have these properties to route correctly.
   */
  sendData(data: T & { podName?: string; namespace?: string; containerName?: string }): void {
    const key = `${data.podName}/${data.namespace}/${data.containerName}`;
    const callback = this.#callbacks.get(key);
    if (callback) {
      callback(data);
    }
  }

  /**
   * Returns the number of active subscriptions.
   * Useful for tests to verify subscriptions are set up.
   */
  get subscriptionCount(): number {
    return this.#callbacks.size;
  }

  /**
   * Wait for a specific number of subscriptions to be registered.
   * Useful for tests that need to wait for async onMount to complete.
   */
  async waitForSubscriptions(count: number, timeoutMs: number = 1000): Promise<void> {
    const start = Date.now();
    while (this.#callbacks.size < count) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timeout waiting for ${count} subscriptions. Current: ${this.#callbacks.size}`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
