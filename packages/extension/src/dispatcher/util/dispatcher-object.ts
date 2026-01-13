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

import type { RpcChannel } from '@kubernetes-dashboard/rpc';
import type { StateSubscriber } from '/@/subscriber/state-subscriber';

export const DispatcherObject = Symbol.for('DispatcherObject');
export interface DispatcherObject<T> {
  get channelName(): string;
  dispatch(subscriber: StateSubscriber, options?: T): Promise<void>;
}

interface SubscriberTimers {
  debounceTimer?: NodeJS.Timeout;
  throttleTimer?: NodeJS.Timeout;
}

// Allow to receive event for a given object
export abstract class AbsDispatcherObjectImpl<T, U> implements DispatcherObject<T> {
  #channel: RpcChannel<U>;

  #debounceTimeout: number;
  #throttleTimeout: number;
  #subscriberTimers: Map<StateSubscriber, SubscriberTimers> = new Map();

  constructor(channel: RpcChannel<U>) {
    this.#channel = channel;
    this.#debounceTimeout = 100;
    this.#throttleTimeout = 200;
  }

  get channelName(): string {
    return this.#channel.name;
  }

  async dispatch(subscriber: StateSubscriber, options?: T): Promise<void> {
    const doDispatch = (): Promise<void> => {
      return subscriber.dispatch(this.#channel, this.getData(options));
    };

    // Get or create timer entry for this subscriber
    let timers = this.#subscriberTimers.get(subscriber);
    if (!timers) {
      timers = {};
      this.#subscriberTimers.set(subscriber, timers);
    }

    // Clear existing debounce timer for this subscriber
    if (timers.debounceTimer) {
      clearTimeout(timers.debounceTimer);
      timers.debounceTimer = undefined;
    }

    // Set new debounce timer for this subscriber
    timers.debounceTimer = setTimeout(() => {
      if (timers.throttleTimer) {
        clearTimeout(timers.throttleTimer);
        timers.throttleTimer = undefined;
      }
      doDispatch()
        .catch(console.error)
        .finally(() => {
          if (timers.debounceTimer) {
            clearTimeout(timers.debounceTimer);
            timers.debounceTimer = undefined;
          }
        });
    }, this.#debounceTimeout);

    // Set throttle timer for this subscriber (if not already set)
    if (!timers.throttleTimer && this.#throttleTimeout > 0) {
      timers.throttleTimer = setTimeout(() => {
        doDispatch()
          .catch(console.error)
          .finally(() => {
            if (timers.throttleTimer) {
              clearTimeout(timers.throttleTimer);
              timers.throttleTimer = undefined;
            }
          });
      }, this.#throttleTimeout);
    }
  }

  /**
   * Clean up timers for a specific subscriber.
   * Should be called when a subscriber is removed or disposed.
   */
  cleanupSubscriber(subscriber: StateSubscriber): void {
    const timers = this.#subscriberTimers.get(subscriber);
    if (timers) {
      if (timers.debounceTimer) {
        clearTimeout(timers.debounceTimer);
      }
      if (timers.throttleTimer) {
        clearTimeout(timers.throttleTimer);
      }
      this.#subscriberTimers.delete(subscriber);
    }
  }

  abstract getData(options?: T): U;
}
