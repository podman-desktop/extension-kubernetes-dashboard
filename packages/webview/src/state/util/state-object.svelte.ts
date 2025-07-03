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

import type { Unsubscriber } from 'svelte/store';
import { API_SUBSCRIBE } from '/@common/channels';
import type { SubscribeApi } from '/@common/interface/subscribe-api';
import type { RpcBrowser, RpcChannel } from '/@common/rpc/rpc';
import type { IDisposable } from '/@common/types/disposable';

export const StateObject = Symbol.for('StateObject');
export interface StateObject<T> extends IDisposable {
  get data(): T | undefined;
  init(): Promise<void>;
}

// Allow to receive event for a given object
export abstract class AbsStateObjectImpl<T> implements StateObject<T> {
  #channelName: string;
  #data = $state<{ value: T | undefined }>({ value: undefined });
  #subscriberUID: number;

  #rpcBrowser: RpcBrowser;
  #subscribeApi: SubscribeApi;

  #disposable: IDisposable | undefined;

  constructor(rpcBrowser: RpcBrowser) {
    this.#rpcBrowser = rpcBrowser;
    this.#subscribeApi = this.#rpcBrowser.getProxy<SubscribeApi>(API_SUBSCRIBE);
    this.#data.value = undefined;
    this.#subscriberUID = 0;
  }

  get data(): T | undefined {
    return this.#data.value;
  }

  protected async initChannel(channel: RpcChannel<T>): Promise<void> {
    this.#channelName = channel.name;
    this.#disposable = this.#rpcBrowser.on(channel, value => {
      this.#data.value = value;
    });
    await this.#subscribeApi.resetChannelSubscribers(this.#channelName);
  }

  dispose(): void {
    this.#disposable?.dispose();
  }

  protected getNextUID(): number {
    return ++this.#subscriberUID;
  }

  subscribe(): Unsubscriber {
    const subscription = this.getNextUID();
    this.#subscribeApi.subscribeToChannel(this.#channelName, subscription).catch(console.error);
    return () => {
      this.#subscribeApi.unsubscribeFromChannel(this.#channelName, subscription).catch(console.error);
    };
  }

  abstract init(): Promise<void>;
}
