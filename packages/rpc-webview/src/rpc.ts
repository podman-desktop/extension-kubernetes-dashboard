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
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Disposable } from '@podman-desktop/api';
import type { WebviewApi } from '@podman-desktop/webview-api';
import { type RpcChannel, type IMessageRequest, isMessageResponse } from '@kubernetes-dashboard/rpc-api';

export type Listener<T> = (value: T) => void;

interface ISubscribedMessage {
  id: string;
  body: any;
}

export class RpcBrowser {
  counter: number = 0;
  promises: Map<number, { resolve: (value: unknown) => unknown; reject: (value: unknown) => void }> = new Map();
  subscribers: Map<string, Set<Listener<unknown>>> = new Map();

  getUniqueId(): number {
    return ++this.counter;
  }

  constructor(
    private window: Window,
    private api: WebviewApi,
  ) {
    this.init();
  }

  init(): void {
    // eslint-disable-next-line sonarjs/post-message
    this.window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (isMessageResponse(message)) {
        if (!this.promises.has(message.id)) {
          console.error('Unknown message id.');
          return;
        }

        const { resolve, reject } = this.promises.get(message.id) ?? {};

        if (message.status === 'error') {
          reject?.(message.error);
        } else {
          resolve?.(message.body);
        }
        this.promises.delete(message.id);
      } else if (this.isSubscribedMessage(message)) {
        this.subscribers.get(message.id)?.forEach(handler => handler(message.body));
      } else {
        console.error('Received incompatible message.', message);
        return;
      }
    });
  }

  // Listen to data on the given channel
  on<T>(channel: RpcChannel<T>, listener: Listener<T>): Disposable {
    const f = (value: unknown): void => {
      listener(value as T);
    };

    // Add the subscriber
    this.subscribers.set(channel.name, (this.subscribers.get(channel.name) ?? new Set()).add(f));

    return {
      dispose: (): void => {
        this.subscribers.get(channel.name)?.delete(f);
      },
    };
  }

  // Get a proxy for the given channel and return a proxy object matching the interface provided.
  getProxy<T>(channel: RpcChannel<T>, options?: { noTimeoutMethods: string[] }): T {
    const noTimeoutMethodsValues = options?.noTimeoutMethods ?? [];

    const proxyHandler: ProxyHandler<object> = {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string') {
          return (...args: unknown[]) => {
            return this.invoke(channel.name, noTimeoutMethodsValues, prop, ...args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    // eslint-disable-next-line no-null/no-null
    return new Proxy(Object.create(null), proxyHandler);
  }

  protected async invoke(
    channel: string,
    noTimeoutMethodsValues: string[],
    method: string,
    ...args: unknown[]
  ): Promise<unknown> {
    // Generate a unique id for the request
    const requestId = this.getUniqueId();

    const promise = new Promise((resolve, reject) => {
      this.promises.set(requestId, { resolve, reject });
    });

    // Post the message
    this.api.postMessage({
      id: requestId,
      channel,
      method,
      args,
    } as IMessageRequest);

    // Add some timeout
    if (!noTimeoutMethodsValues.includes(method)) {
      setTimeout(() => {
        const { reject } = this.promises.get(requestId) ?? {};
        if (!reject) return;
        console.error('Timeout when sending the request', args);
        reject(new Error('Timeout'));
        this.promises.delete(requestId);
      }, 5000);
    }

    // Create a Promise
    return promise;
  }
  /*
  Subscribe(msgId: string, f: Listener): Subscriber {
    this.subscribers.set(msgId, (this.subscribers.get(msgId) ?? new Set()).add(f));

    return {
      unsubscribe: (): void => {
        this.subscribers.get(msgId)?.delete(f);
      },
    };
  }*/

  isSubscribedMessage(content: any): content is ISubscribedMessage {
    return !!content && 'id' in content && 'body' in content && this.subscribers.has(content.id);
  }
}
