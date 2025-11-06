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

import util from 'node:util';

import { type IDisposable } from '@kubernetes-dashboard/channels';
import type { StateSubscriber } from './state-subscriber';
import { Emitter, type Event } from '/@/types/emitter';
import type { RpcChannel } from '@kubernetes-dashboard/rpc';
import { Disposable } from '@podman-desktop/api';

interface ApiSubscriberInfo<T> {
  options: unknown;
  listener: (event: T) => void;
}

export class ApiSubscriber implements StateSubscriber, IDisposable {
  #subscribers: { [channelName: string]: ApiSubscriberInfo<any>[] } = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

  #onSubscribe = new Emitter<string>();
  onSubscribe: Event<string> = this.#onSubscribe.event;

  async resetApiSubscribers(channelName: string): Promise<void> {
    this.#subscribers[channelName] = [];
  }

  subscribe<T>(channel: RpcChannel<T>, options: unknown, listener: (event: T) => void): Disposable {
    const channelName = channel.name;
    this.#subscribers[channelName] = [...(this.#subscribers[channelName] ?? []), { options, listener }];

    this.#onSubscribe.fire(channelName);

    return Disposable.create(() => {
      this.#subscribers[channelName] = (this.#subscribers[channelName] ?? []).filter(
        subscriber => subscriber.listener !== listener,
      );
    });
  }

  hasSubscribers(channelName: string): boolean {
    return channelName in this.#subscribers && this.#subscribers[channelName].length > 0;
  }

  getSubscriptions(channelName: string): unknown[] {
    if (!(channelName in this.#subscribers)) {
      return [];
    }
    return (
      this.#subscribers[channelName]
        .map(subscriber => subscriber.options)
        .filter(options => !!options)
        // return unique values
        .filter((value, index, self) => self.findIndex(elt => util.isDeepStrictEqual(value, elt)) === index)
    );
  }

  async dispatch<T>(channel: RpcChannel<T>, data: T): Promise<void> {
    const subscriptions = this.#subscribers[channel.name];
    if (!subscriptions) {
      return;
    }
    for (const subscription of subscriptions) {
      subscription.listener(data);
    }
  }

  dispose(): void {
    this.#subscribers = {};
  }
}
