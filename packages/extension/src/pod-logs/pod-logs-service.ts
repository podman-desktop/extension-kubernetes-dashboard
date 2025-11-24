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

import { POD_LOGS, type PodLogsOptions } from '@kubernetes-dashboard/channels';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import { Log } from '@kubernetes/client-node';
import { injectable } from 'inversify';
import { PassThrough } from 'node:stream';
import { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';

@injectable()
export class PodLogsService {
  #abortController: AbortController | undefined;
  #logStream: PassThrough | undefined;

  constructor(
    private readonly context: KubeConfigSingleContext,
    private readonly rpcExtension: RpcExtension,
  ) {}

  async startStream(
    podName: string,
    namespace: string,
    containerName: string,
    options?: PodLogsOptions,
  ): Promise<void> {
    // Clean up any existing stream first
    if (this.#abortController) {
      this.#abortController.abort();
    }
    if (this.#logStream) {
      this.#logStream.destroy();
    }

    const log = new Log(this.context.getKubeConfig());

    // Create a new stream for this specific request
    const logStream = new PassThrough();

    logStream.on('data', (chunk: unknown) => {
      if (!Buffer.isBuffer(chunk)) {
        console.error('chunk is not a buffer', chunk);
        return;
      }
      this.rpcExtension
        .fire(POD_LOGS, {
          podName,
          namespace,
          containerName,
          data: chunk.toString('utf-8'),
        })
        .catch(console.error);
    });

    const abortController = await log.log(namespace, podName, containerName, logStream, {
      follow: options?.stream ?? true,
      previous: options?.previous,
      tailLines: options?.tailLines,
      sinceSeconds: options?.sinceSeconds,
      timestamps: options?.timestamps,
    });

    // Store references for cleanup
    this.#abortController = abortController;
    this.#logStream = logStream;
  }

  stopStream(): void {
    this.#abortController?.abort();
    this.#logStream?.destroy();
    this.#abortController = undefined;
    this.#logStream = undefined;
  }
}
