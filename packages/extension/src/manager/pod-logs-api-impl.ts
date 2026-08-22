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
    console.log(`[pod-logs-api] streamPodLogs called for ${podName}/${namespace}/${containerName}`);
    if (!this.contextsManager.currentContext) {
      throw new Error('No current context found');
    }
    const key = this.getKey(podName, namespace, containerName);
    const instance = this.#instances.get(key) ?? {
      counter: 0,
      service: new PodLogsService(this.contextsManager.currentContext, this.rpcExtension),
    };
    instance.counter++;
    console.log(`[pod-logs-api] instance counter for ${key}: ${instance.counter}`);
    if (instance.counter === 1) {
      console.log(`[pod-logs-api] starting stream for ${key}`);
      await instance.service.startStream(podName, namespace, containerName, options);
      console.log(`[pod-logs-api] stream started for ${key}`);
    }
    this.#instances.set(key, instance);
  }

  async stopStreamPodLogs(podName: string, namespace: string, containerName: string): Promise<void> {
    const key = this.getKey(podName, namespace, containerName);
    console.log(`[pod-logs-api] stopStreamPodLogs called for ${key}`);
    const instance = this.#instances.get(key);
    if (instance) {
      instance.counter--;
      console.log(`[pod-logs-api] instance counter for ${key}: ${instance.counter}`);
      if (instance.counter === 0) {
        console.log(`[pod-logs-api] stopping stream for ${key}`);
        instance.service.stopStream();
        this.#instances.delete(key);
      }
    } else {
      console.log(`[pod-logs-api] no instance found for ${key}`);
    }
  }

  getKey(podName: string, namespace: string, containerName: string): string {
    return `${podName}|${namespace}|${containerName}`;
  }

  dispose(): void {
    console.log(`[pod-logs-api] dispose called, ${this.#instances.size} instances`);
    this.#instances.forEach((instance, key) => {
      console.log(`[pod-logs-api] disposing stream for ${key}`);
      instance.service.stopStream();
    });
    this.#instances.clear();
  }
}
