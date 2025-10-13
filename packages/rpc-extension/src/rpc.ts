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

/**
 * The below file creatse a "RPC" like communication between the webview and the browser.
 * Being able to provide a simple wall to call functions between the backend and frontend portions of the extension.
 *
 * Keep note that there is a timeout of 10 seconds for each request, if the request is not answered in that time, it will be rejected.
 * So calls that take longer than 10 seconds should be avoided, this can be adjusted by increasing the timeout.
 */
import type { Disposable, Webview } from '@podman-desktop/api';
import { type RpcChannel, isMessageRequest, type IMessageResponse } from '@kubernetes-dashboard/rpc-api';

// Instance has methods that are callable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ObjectInstance<T> = {
  [key: string]: (...args: unknown[]) => unknown;
};

export class RpcExtension implements Disposable {
  #webviewDisposable: Disposable | undefined;

  #instances: Map<string, ObjectInstance<unknown>> = new Map();

  constructor(private webview: Webview) {}

  dispose(): void {
    this.#webviewDisposable?.dispose();
  }

  init(): void {
    this.#webviewDisposable = this.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!isMessageRequest(message)) {
        console.error('Received incompatible message.', message);
        return;
      }

      if (!this.#instances.has(message.channel)) {
        console.error(
          `Trying to call on an unknown channel ${message.channel}. Available: ${Array.from(this.#instances.keys())}`,
        );
        throw new Error('channel does not exist.');
      }

      try {
        const result = await this.#instances.get(message.channel)?.[message.method]?.(...message.args);
        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: result,
          status: 'success',
        } as IMessageResponse);
      } catch (err: unknown) {
        let errorMessage: string;
        // Depending on the object throw we try to extract the error message
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = String(err);
        }

        await this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: undefined,
          status: 'error',
          error: errorMessage,
        } as IMessageResponse);
      }
    });
  }

  registerInstance<T, R extends T>(channel: RpcChannel<T>, instance: R): void {
    // Convert the instance to an object with method names as keys
    this.#instances.set(channel.name, instance as ObjectInstance<unknown>);
  }

  fire<T>(channel: RpcChannel<T>, body: T): Promise<boolean> {
    return this.webview.postMessage({
      id: channel.name,
      body,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class RpcChannelImpl<T> {
  constructor(private channel: string) {}

  public get name(): string {
    return this.channel;
  }
}

export function createRpcChannel<T>(channel: string): RpcChannel<T> {
  return new RpcChannelImpl<T>(channel);
}
