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

import { inject } from 'inversify';
import { Remote } from '/@/remote/remote';
import {
  API_POD_LOGS,
  POD_LOGS,
  type PodLogsApi,
  type PodLogsChunk,
  type IDisposable,
} from '@kubernetes-dashboard/channels';
import { RpcBrowser } from '@kubernetes-dashboard/rpc';
import type { StreamObject } from './util/stream-object';

export class StreamPodLogs implements StreamObject<PodLogsChunk, void> {
  #podLogsApi: PodLogsApi;

  constructor(
    @inject(Remote) remote: Remote,
    @inject(RpcBrowser) private rpcBrowser: RpcBrowser,
  ) {
    this.#podLogsApi = remote.getProxy(API_POD_LOGS);
  }
  async subscribe(
    podName: string,
    namespace: string,
    containerName: string,
    options: void,
    callback: (data: PodLogsChunk) => void,
  ): Promise<IDisposable> {
    const disposable = this.rpcBrowser.on(POD_LOGS, chunk => {
      if (chunk.podName !== podName || chunk.namespace !== namespace || chunk.containerName !== containerName) {
        return;
      }
      callback(chunk);
    });
    await this.#podLogsApi.streamPodLogs(podName, namespace, containerName);
    return {
      dispose: () => {
        disposable.dispose();
        this.#podLogsApi.stopStreamPodLogs(podName, namespace, containerName).catch(console.error);
      },
    } as IDisposable;
  }
}
