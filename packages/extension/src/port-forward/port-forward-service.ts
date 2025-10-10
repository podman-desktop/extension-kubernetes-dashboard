/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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
import { randomUUID } from 'node:crypto';

import { PortForwardConnectionService } from './port-forward-connection';
import { ForwardConfigRequirements } from './port-forward-validation';
import { ConfigManagementService, MemoryBasedStorage } from './port-forward-storage';
import {
  Disposable,
  type IDisposable,
  type ForwardConfig,
  type ForwardOptions,
  type DeletePortForwardOptions,
} from '@kubernetes-dashboard/channels';
import { ContextsManager } from '/@/manager/contexts-manager';
import { inject, injectable } from 'inversify';
import { Emitter, Event } from '/@/types/emitter';
import { SystemApiImpl } from '../manager/system-api';
import { window } from '@podman-desktop/api';

/**
 * Service provider for Kubernetes port forwarding.
 * Entrypoint for the third party services to operate with port forwards.
 * @see PortForwardServiceProvider.getService
 */
@injectable()
export class PortForwardServiceProvider {
  @inject(ContextsManager)
  private contextsManager: ContextsManager;

  @inject(SystemApiImpl)
  private systemApi: SystemApiImpl;

  #service: PortForwardService | undefined;
  #disposables: IDisposable[] = [];

  #onForwardsChange = new Emitter<void>();
  onForwardsChange: Event<void> = this.#onForwardsChange.event;

  init(): void {
    this.contextsManager.onCurrentContextChange(async () => {
      this.disposeService();
    });
  }
  /**
   * Gets the port forward service for the given Kubernetes configuration.
   * @param kubeClient the Kubernetes client
   * @param apiSender the api sender object
   * @returns The port forward service.
   */
  getService(): PortForwardService {
    if (this.#service) {
      return this.#service;
    }
    const currentContext = this.contextsManager.currentContext;
    if (!currentContext) {
      throw new Error('No current context found');
    }
    const kubeConfig = currentContext.getKubeConfig();

    const isFreePort = async (port: number): Promise<boolean> => {
      return (await this.systemApi.getFreePort(port)) === port;
    };

    const forwardingConnectionService = new PortForwardConnectionService(
      this.contextsManager,
      kubeConfig,
      new ForwardConfigRequirements(isFreePort),
    );
    const forwardConfigStorage = new MemoryBasedStorage();
    const configManagementService = new ConfigManagementService(forwardConfigStorage);
    this.#service = new PortForwardService(configManagementService, forwardingConnectionService);
    this.#disposables.push(
      this.#service.onForwardsChange(() => {
        this.#onForwardsChange.fire();
      }),
    );
    return this.#service;
  }

  protected disposeService(): void {
    this.#service?.dispose();
    this.#service = undefined;
    this.#disposables.forEach(disposable => disposable.dispose());
    this.#disposables = [];
  }
}

/**
 * Service for managing Kubernetes port forwarding.
 * @see KubernetesPortForwardServiceProvider.getService
 */
export class PortForwardService implements IDisposable {
  #forwards: Map<string, IDisposable> = new Map();

  #onForwardsChange = new Emitter<void>();
  onForwardsChange: Event<void> = this.#onForwardsChange.event;

  /**
   * Creates an instance of KubernetesPortForwardService.
   * @param configManagementService - The configuration management service.
   * @param forwardingConnectionService - The port forward connection service.
   * @param apiSender the api sender object
   */
  constructor(
    private configManagementService: ConfigManagementService,
    private forwardingConnectionService: PortForwardConnectionService,
  ) {}

  dispose(): void {
    this.#forwards.forEach(forward => forward.dispose());
    this.#forwards.clear();
  }

  /**
   * Creates a new forward configuration
   * @returns The created forward configuration.
   * @param options
   */
  async createForward(options: ForwardOptions): Promise<ForwardConfig> {
    const result: ForwardConfig = await this.configManagementService.createForward({
      id: randomUUID(),
      name: options.name,
      forward: options.forward,
      namespace: options.namespace,
      kind: options.kind,
    });
    this.#onForwardsChange.fire();
    return result;
  }

  /**
   * Deletes an existing forward configuration.
   * @param config - The forward configuration to delete.
   * @returns Void if the operation successful.
   * @see ForwardConfig
   */
  async deleteForward(config: ForwardConfig, options?: DeletePortForwardOptions): Promise<void> {
    if (options?.askConfirmation) {
      const result = await window.showInformationMessage(
        `Are you sure you want to delete the port forwarding ${config.name}?`,
        'Yes',
        'Cancel',
      );
      if (result !== 'Yes') {
        return;
      }
    }

    const forward = this.#forwards.get(config.id);
    forward?.dispose();
    this.#forwards.delete(config.id);

    await this.configManagementService.deleteForward(config);
    this.#onForwardsChange.fire();
  }

  /**
   * Lists all forward configurations.
   * @returns A list of forward configurations.
   * @see ForwardConfig
   */
  listForwards(): ForwardConfig[] {
    return this.configManagementService.listForwards();
  }

  /**
   * Starts the port forwarding for the given configuration.
   * @param config - The forward configuration.
   * @returns A disposable resource to stop the forwarding.
   * @see ForwardConfig
   */
  async startForward(config: ForwardConfig): Promise<IDisposable> {
    if (this.#forwards.has(config.id)) throw new Error('forward already started');

    const forward = await this.forwardingConnectionService.startForward(config);
    this.#forwards.set(config.id, forward);

    return Disposable.create(() => {
      this.#forwards.delete(config.id);
      forward.dispose();
    });
  }
}
