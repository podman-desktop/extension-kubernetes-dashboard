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

    console.log(`[pod-logs] startStream called for ${namespace}/${podName}/${containerName}, follow=${options?.follow ?? true}`);

    this.#logStream.on('data', (chunk: unknown) => {
      if (!Buffer.isBuffer(chunk)) {
        console.error('[pod-logs] chunk is not a buffer', chunk);
        return;
      }
      console.log(`[pod-logs] received data chunk (${chunk.length} bytes) for ${namespace}/${podName}/${containerName}`);
      this.rpcExtension
        .fire(POD_LOGS, {
          podName,
          namespace,
          containerName,
          data: chunk.toString('utf-8'),
        })
        .then(() => {
          console.log(`[pod-logs] fire completed for ${namespace}/${podName}/${containerName}`);
        })
        .catch(err => {
          console.error(`[pod-logs] fire error for ${namespace}/${podName}/${containerName}:`, err);
        });
    });

    this.#logStream.on('end', () => {
      console.log(`[pod-logs] stream ended for ${namespace}/${podName}/${containerName}`);
    });

    this.#logStream.on('error', (err: unknown) => {
      console.error(`[pod-logs] stream error for ${namespace}/${podName}/${containerName}:`, err);
    });

    console.log(`[pod-logs] calling log.log for ${namespace}/${podName}/${containerName}`);
    this.#abortController = await log.log(namespace, podName, containerName, this.#logStream, {
      follow: options?.follow ?? true,
      previous: options?.previous,
      tailLines: options?.tailLines,
      sinceSeconds: options?.sinceSeconds,
      timestamps: options?.timestamps,
    });
    console.log(`[pod-logs] log.log returned for ${namespace}/${podName}/${containerName}`);
  }

  stopStream(): void {
    console.log('[pod-logs] stopStream called');
    this.#abortController.abort();
    console.log('[pod-logs] abortController.abort() called');
  }
}
