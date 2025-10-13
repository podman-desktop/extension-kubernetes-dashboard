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

import { inject, injectable } from 'inversify';
import { IDisposable, PodTerminalsApi } from '@kubernetes-dashboard/channels';
import { PodTerminalService } from '/@/pod-terminal/pod-terminal-service';
import { ContextsManager } from './contexts-manager';
import { RpcExtension } from '@kubernetes-dashboard/rpc-extension';

type PodTerminalInstance = {
  service: PodTerminalService;
  connected: boolean;
};

@injectable()
export class PodTerminalsApiImpl implements PodTerminalsApi, IDisposable {
  #instances: Map<string, PodTerminalInstance> = new Map();

  constructor(
    @inject(ContextsManager) private contextsManager: ContextsManager,
    @inject(RpcExtension) private rpcExtension: RpcExtension,
  ) {}

  async startTerminal(podName: string, namespace: string, containerName: string): Promise<void> {
    if (!this.contextsManager.currentContext) {
      throw new Error('No current context found');
    }
    let instance: PodTerminalInstance | undefined = this.#instances.get(this.getKey(podName, namespace, containerName));

    if (!instance) {
      instance = {
        service: new PodTerminalService(
          this.contextsManager.currentContext,
          this.rpcExtension,
          podName,
          namespace,
          containerName,
        ),
        connected: false,
      };
      this.#instances.set(this.getKey(podName, namespace, containerName), instance);
    }

    if (!instance.connected) {
      await instance.service.startTerminal(async (): Promise<void> => {
        if (instance) {
          instance.connected = false;
        }
      });
      instance.connected = true;
    }
  }

  async sendData(podName: string, namespace: string, containerName: string, data: string): Promise<void> {
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName));
    if (instance) {
      await instance.service.sendData(data);
    }
  }

  async resizeTerminal(
    podName: string,
    namespace: string,
    containerName: string,
    cols: number,
    rows: number,
  ): Promise<void> {
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName));
    if (instance) {
      await instance.service.resizeTerminal(cols, rows);
    }
  }

  async saveState(podName: string, namespace: string, containerName: string, state: string): Promise<void> {
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName));
    if (instance) {
      await instance.service.saveState(state);
    }
  }

  async getState(podName: string, namespace: string, containerName: string): Promise<string> {
    const instance = this.#instances.get(this.getKey(podName, namespace, containerName));
    if (instance) {
      return await instance.service.getState();
    }
    return '';
  }

  getKey(podName: string, namespace: string, containerName: string): string {
    return `${podName}|${namespace}|${containerName}`;
  }

  dispose(): void {
    this.#instances.forEach(instance => instance.service.stopTerminal());
    this.#instances.clear();
  }
}
