/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
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

import type { KubernetesContextResources } from '/@common/model/kubernetes-resources.js';
import type { KubernetesTroubleshootingInformation } from '/@common/model/kubernetes-troubleshooting.js';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import { ContextsManager } from './contexts-manager.js';
import { RpcExtension } from '/@common/rpc/rpc.js';
import { UPDATE_RESOURCE } from '/@common/channels.js';
import { inject, injectable } from 'inversify';
import { ResourcesCountDispatcher } from '../dispatcher/resources-count-dispatcher.js';
import { ContextsHealthsDispatcher } from '../dispatcher/contexts-healths-dispatcher.js';
import { ActiveResourcesCountDispatcher } from '../dispatcher/active-resources-count-dispatcher.js';
import { ContextsPermissionsDispatcher } from '../dispatcher/contexts-permissions-dispatcher.js';

@injectable()
export class ContextsStatesDispatcher {
  @inject(ContextsManager)
  private manager: ContextsManager;

  @inject(RpcExtension)
  private rpcExtension: RpcExtension;

  @inject(ResourcesCountDispatcher)
  private resourcesCountDispatcher: ResourcesCountDispatcher;

  @inject(ActiveResourcesCountDispatcher)
  private activeResourcesCountDispatcher: ActiveResourcesCountDispatcher;

  @inject(ContextsHealthsDispatcher)
  private contextsHealthsDispatcher: ContextsHealthsDispatcher;

  @inject(ContextsPermissionsDispatcher)
  private contextsPermissionsDispatcher: ContextsPermissionsDispatcher;

  init(): void {
    this.manager.onContextHealthStateChange((_state: ContextHealthState) => this.contextsHealthsDispatcher.dispatch());
    this.manager.onOfflineChange(async () => {
      await this.contextsHealthsDispatcher.dispatch();
      await this.resourcesCountDispatcher.dispatch();
      await this.activeResourcesCountDispatcher.dispatch();
    });
    this.manager.onContextPermissionResult((_permissions: ContextPermissionResult) =>
      this.contextsPermissionsDispatcher.dispatch(),
    );
    this.manager.onContextDelete(async (_state: DispatcherEvent) => {
      await this.contextsHealthsDispatcher.dispatch();
      await this.contextsPermissionsDispatcher.dispatch();
    });
    this.manager.onResourceCountUpdated(() => this.resourcesCountDispatcher.dispatch());
    this.manager.onResourceUpdated(async event => {
      await this.updateResource(event.resourceName, event.contextName);
      await this.activeResourcesCountDispatcher.dispatch();
    });
  }

  async updateResource(resourceName: string, contextName: string): Promise<void> {
    await this.rpcExtension.fire(UPDATE_RESOURCE, {
      contextName,
      resourceName,
      resources: this.getResources([contextName], resourceName),
    });
  }

  getResources(contextNames: string[], resourceName: string): KubernetesContextResources[] {
    return this.manager.getResources(contextNames, resourceName);
  }

  getTroubleshootingInformation(): KubernetesTroubleshootingInformation {
    return this.manager.getTroubleshootingInformation();
  }
}
