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

import type { ContextHealth } from '/@common/model/kubernetes-contexts-healths.js';
import type { ContextPermission } from '/@common/model/kubernetes-contexts-permissions.js';
import type { ResourceCount } from '/@common/model/kubernetes-resource-count.js';
import type { KubernetesContextResources } from '/@common/model/kubernetes-resources.js';
import type { KubernetesTroubleshootingInformation } from '/@common/model/kubernetes-troubleshooting.js';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import type { ContextsManager } from './contexts-manager.js';
import type { RpcExtension } from '/@common/rpc/rpc.js';
import {
  ACTIVE_RESOURCES_COUNT,
  CONTEXTS_HEALTHS,
  CONTEXTS_PERMISSIONS,
  RESOURCES_COUNT,
  UPDATE_RESOURCE,
} from '/@common/channels.js';

export class ContextsStatesDispatcher {
  constructor(
    private manager: ContextsManager,
    private rpcExtension: RpcExtension,
  ) {}

  init(): void {
    this.manager.onContextHealthStateChange((_state: ContextHealthState) => this.updateHealthStates());
    this.manager.onOfflineChange(async () => {
      await this.updateHealthStates();
      await this.updateResourcesCount();
      await this.updateActiveResourcesCount();
    });
    this.manager.onContextPermissionResult((_permissions: ContextPermissionResult) => this.updatePermissions());
    this.manager.onContextDelete(async (_state: DispatcherEvent) => {
      await this.updateHealthStates();
      await this.updatePermissions();
    });
    this.manager.onResourceCountUpdated(() => this.updateResourcesCount());
    this.manager.onResourceUpdated(async event => {
      await this.updateResource(event.resourceName, event.contextName);
      await this.updateActiveResourcesCount();
    });
  }

  async updateHealthStates(): Promise<void> {
    await this.rpcExtension.fire(CONTEXTS_HEALTHS, {
      healths: this.getContextsHealths(),
    });
  }

  getContextsHealths(): ContextHealth[] {
    const value: ContextHealth[] = [];
    for (const [contextName, health] of this.manager.getHealthCheckersStates()) {
      value.push({
        contextName,
        checking: health.checking,
        reachable: health.reachable,
        offline: this.manager.isContextOffline(contextName),
        errorMessage: health.errorMessage,
      });
    }
    return value;
  }

  async updatePermissions(): Promise<void> {
    await this.rpcExtension.fire(CONTEXTS_PERMISSIONS, {
      permissions: this.getContextsPermissions(),
    });
  }

  getContextsPermissions(): ContextPermission[] {
    return this.manager.getPermissions();
  }

  async updateResourcesCount(): Promise<void> {
    await this.rpcExtension.fire(RESOURCES_COUNT, {
      counts: this.getResourcesCount(),
    });
  }

  async updateActiveResourcesCount(): Promise<void> {
    await this.rpcExtension.fire(ACTIVE_RESOURCES_COUNT, {
      counts: this.getActiveResourcesCount(),
    });
  }

  getResourcesCount(): ResourceCount[] {
    return this.manager.getResourcesCount();
  }

  getActiveResourcesCount(): ResourceCount[] {
    return this.manager.getActiveResourcesCount();
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
