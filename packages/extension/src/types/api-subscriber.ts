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

import { Disposable } from '@kubernetes-dashboard/channels';
import type { StateSubscriber } from '/@/types/state-subscriber';
import { Emitter, type Event } from '/@/types/emitter';
import type { RpcChannel } from '@kubernetes-dashboard/rpc';

interface ApiSubscriberInfo {
  uid: symbol;
  options: unknown;
}

export class ApiSubscriber implements StateSubscriber {
  #subscribers: { [channelName: string]: ApiSubscriberInfo[] } = {};

  #onSubscribe = new Emitter<string>();
  onSubscribe: Event<string> = this.#onSubscribe.event;

  subscribe(channelName: string, options: unknown): Disposable {
    const uid = Symbol();
    this.#subscribers[channelName] = [...(this.#subscribers[channelName] ?? []), { uid, options }];

    this.#onSubscribe.fire(channelName);

    return Disposable.create(() => {
      this.#subscribers[channelName] = (this.#subscribers[channelName] ?? []).filter(
        subscriber => subscriber.uid !== uid,
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

  async dispatch<T>(_channel: RpcChannel<T>, _data: T): Promise<void> {
    // TODO implement
  }
}
