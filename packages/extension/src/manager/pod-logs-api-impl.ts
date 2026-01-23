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

import { inject, injectable } from 'inversify';
import { IDisposable, PodLogsApi } from '@kubernetes-dashboard/channels';
import { PodLogsService } from '/@/pod-logs/pod-logs-service';
import { ContextsManager } from './contexts-manager';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import type { PodLogsOptions } from '@kubernetes-dashboard/channels';

type PodLogsInstance = {
  counter: number;
  service: PodLogsService;
};

@injectable()
export class PodLogsApiImpl implements PodLogsApi, IDisposable {
  #instances: Map<string, PodLogsInstance> = new Map();
  constructor(
    @inject(ContextsManager) private contextsManager: ContextsManager,
    @inject(RpcExtension) private rpcExtension: RpcExtension,
  ) {}

  async streamPodLogs(
    podName: string,
    namespace: string,
    containerName: string,
    options?: PodLogsOptions,
  ): Promise<void> {
    if (!this.contextsManager.currentContext) {
      throw new Error('No current context found');
    }
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName)) ?? {
      counter: 0,
      service: new PodLogsService(this.contextsManager.currentContext, this.rpcExtension),
    };
    instance.counter++;
    if (instance.counter === 1) {
      await instance.service.startStream(podName, namespace, containerName, options);
    }
    this.#instances.set(this.getKey(podName, namespace, containerName), instance);
  }

  async stopStreamPodLogs(podName: string, namespace: string, containerName: string): Promise<void> {
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName));
    if (instance) {
      instance.counter--;
      if (instance.counter === 0) {
        instance.service.stopStream();
        this.#instances.delete(this.getKey(podName, namespace, containerName));
      }
    }
  }

  getKey(podName: string, namespace: string, containerName: string): string {
    return `${podName}|${namespace}|${containerName}`;
  }

  dispose(): void {
    this.#instances.forEach(instance => instance.service.stopStream());
    this.#instances.clear();
  }
}
