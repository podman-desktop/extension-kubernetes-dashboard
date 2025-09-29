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
import { API_POD_TERMINALS, POD_TERMINAL_DATA } from '/@common/channels';
import { RpcBrowser } from '/@common/rpc/rpc';
import { Disposable, type IDisposable } from '/@common/types/disposable';
import type { PodTerminalsApi } from '/@common/interface/pod-terminals-api';
import type { PodTerminalChunk } from '/@common/model/pod-terminal-chunk';

export class StreamPodTerminals {
  #podTerminalsApi: PodTerminalsApi;

  constructor(
    @inject(Remote) remote: Remote,
    @inject(RpcBrowser) private rpcBrowser: RpcBrowser,
  ) {
    this.#podTerminalsApi = remote.getProxy(API_POD_TERMINALS);
  }
  async subscribe(
    podName: string,
    namespace: string,
    containerName: string,
    callback: (data: PodTerminalChunk) => void,
  ): Promise<IDisposable> {
    const disposable = this.rpcBrowser.on(POD_TERMINAL_DATA, data => {
      callback(data);
    });
    await this.#podTerminalsApi.startTerminal(podName, namespace, containerName);
    return Disposable.create(() => {
      disposable.dispose();
    });
  }
}
