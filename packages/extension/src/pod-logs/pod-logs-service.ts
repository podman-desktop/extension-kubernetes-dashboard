/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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
import type { Readable } from 'node:stream';
import { PassThrough } from 'node:stream';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import { POD_LOGS, PodLogsOptions } from '@kubernetes-dashboard/channels';
import { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';

@injectable()
export class PodLogsService {
  #abortController: AbortController;
  #logStream: PassThrough;

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
    const log = new Log(this.context.getKubeConfig());

    this.#logStream = new PassThrough();

    this.#logStream.on('data', (chunk: unknown) => {
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

    // Log.log pipes the response body into this stream without ever attaching an error
    // handler to the source (`Readable.fromWeb(response.body).pipe(stream)`), and pipe()
    // does not forward source errors to the destination. Aborting the request in
    // stopStream therefore makes that source emit an 'error' with no listener, which
    // Node rethrows as an uncaught exception. In Electron's main process that pops the
    // default modal error dialog and freezes the whole application.
    // Listening for 'pipe' is the only way to get a reference to the source stream.
    this.#logStream.on('pipe', (source: Readable) => {
      source.on('error', (error: unknown) => {
        console.debug(`log stream of ${namespace}/${podName}/${containerName} ended`, error);
      });
    });

    this.#abortController = await log.log(namespace, podName, containerName, this.#logStream, {
      follow: options?.follow ?? true,
      previous: options?.previous,
      tailLines: options?.tailLines,
      sinceSeconds: options?.sinceSeconds,
      timestamps: options?.timestamps,
    });
  }

  stopStream(): void {
    this.#abortController.abort();
  }
}
