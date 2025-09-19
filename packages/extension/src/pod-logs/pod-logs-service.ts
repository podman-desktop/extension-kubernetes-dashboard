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

import { Log } from '@kubernetes/client-node';
import { injectable } from 'inversify';
import { PassThrough } from 'node:stream';
import { KubeConfigSingleContext } from '../types/kubeconfig-single-context';
import { RpcExtension } from '/@common/rpc/rpc';
import { POD_LOGS } from '/@common/channels';

@injectable()
export class PodLogsService {
  #abortController: AbortController;
  #logStream: PassThrough;

  constructor(
    private readonly context: KubeConfigSingleContext,
    private readonly rpcExtension: RpcExtension,
  ) {}

  async startStream(podName: string, namespace: string, containerName: string): Promise<void> {
    const log = new Log(this.context.getKubeConfig());

    this.#logStream = new PassThrough();

    this.#logStream.on('data', chunk => {
      this.rpcExtension
        .fire(POD_LOGS, {
          podName,
          namespace,
          containerName,
          data: chunk.toString('utf-8'),
        })
        .catch(console.error);
    });
    this.#abortController = await log.log(namespace, podName, containerName, this.#logStream, { follow: true });
  }

  stopStream(): void {
    this.#abortController.abort();
  }
}
