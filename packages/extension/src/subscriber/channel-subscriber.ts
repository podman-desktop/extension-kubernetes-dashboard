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

import type { Event } from '/@/types/emitter';
import { Emitter } from '/@/types/emitter';
import type { StateSubscriber } from './state-subscriber';
import { RpcChannel, RpcExtension } from '@kubernetes-dashboard/rpc';
import { inject, injectable } from 'inversify';

interface ChannelSubscriberInfo {
  uid: number;
  options: unknown;
}

@injectable()
export class ChannelSubscriber implements StateSubscriber {
  @inject(RpcExtension)
  private rpcExtension: RpcExtension;

  #subscribers: { [channelName: string]: ChannelSubscriberInfo[] } = {};

  #onSubscribe = new Emitter<string>();

  onSubscribe: Event<string> = this.#onSubscribe.event;

  async resetChannelSubscribers(channelName: string): Promise<void> {
    this.#subscribers[channelName] = [];
  }

  async subscribeToChannel<T>(channelName: string, options: T, subscription: number): Promise<void> {
    // assert that subscriptions are not done with the same UID
    if ((this.#subscribers[channelName] ?? []).filter(subscriber => subscriber.uid === subscription).length > 0) {
      console.warn('subscription already in use for channel', channelName, subscription);
    }
    this.#subscribers[channelName] = [...(this.#subscribers[channelName] ?? []), { uid: subscription, options }];
    this.#onSubscribe.fire(channelName);
  }

  async unsubscribeFromChannel(channelName: string, subscription: number): Promise<void> {
    // assert that a subscription exists with the UID
    if ((this.#subscribers[channelName] ?? []).filter(subscriber => subscriber.uid === subscription).length === 0) {
      console.warn('subscription does not exist for channel', channelName, subscription);
    }
    this.#subscribers[channelName] = (this.#subscribers[channelName] ?? []).filter(
      subscriber => subscriber.uid !== subscription,
    );
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
    await this.rpcExtension.fire(channel, data);
  }
}
