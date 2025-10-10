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

import type { RpcChannel, RpcExtension } from '@kubernetes-dashboard/rpc';

export const DispatcherObject = Symbol.for('DispatcherObject');
export interface DispatcherObject<T> {
  get channelName(): string;
  dispatch(options?: T): Promise<void>;
}

// Allow to receive event for a given object
export abstract class AbsDispatcherObjectImpl<T, U> implements DispatcherObject<T> {
  #channel: RpcChannel<U>;

  #debounceTimeout: number;
  #throttleTimeout: number;
  #debounceTimer: NodeJS.Timeout | undefined;
  #throttleTimer: NodeJS.Timeout | undefined;

  constructor(
    private rpcExtension: RpcExtension,
    channel: RpcChannel<U>,
  ) {
    this.#channel = channel;
    this.#debounceTimeout = 100;
    this.#throttleTimeout = 200;
  }

  get channelName(): string {
    return this.#channel.name;
  }

  async dispatch(options?: T): Promise<void> {
    const doDispatch = (): Promise<boolean> => {
      return this.rpcExtension.fire(this.#channel, this.getData(options));
    };

    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = undefined;
    }
    this.#debounceTimer = setTimeout(() => {
      if (this.#throttleTimer) {
        clearTimeout(this.#throttleTimer);
        this.#throttleTimer = undefined;
      }
      doDispatch()
        .catch(console.error)
        .finally(() => {
          clearTimeout(this.#debounceTimer);
          this.#debounceTimer = undefined;
        });
    }, this.#debounceTimeout);

    if (!this.#throttleTimer && this.#throttleTimeout > 0) {
      this.#throttleTimer = setTimeout(() => {
        doDispatch()
          .catch(console.error)
          .finally(() => {
            clearTimeout(this.#throttleTimer);
            this.#throttleTimer = undefined;
          });
      }, this.#throttleTimeout);
    }
  }

  abstract getData(options?: T): U;
}
