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

import type { KubernetesTroubleshootingInformation } from '/@common/model/kubernetes-troubleshooting.js';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import { ContextsManager } from './contexts-manager.js';
import { RpcChannel } from '/@common/rpc/rpc.js';
import {
  ACTIVE_RESOURCES_COUNT,
  CONTEXTS_HEALTHS,
  CONTEXTS_PERMISSIONS,
  RESOURCES_COUNT,
  UPDATE_RESOURCE,
} from '/@common/channels.js';
import { inject, injectable, multiInject } from 'inversify';
import { DispatcherObject } from '../dispatcher/util/dispatcher-object.js';

@injectable()
export class ContextsStatesDispatcher {
  @inject(ContextsManager)
  private manager: ContextsManager;

  #dispatchers: Map<string, DispatcherObject<unknown>> = new Map();

  constructor(@multiInject(DispatcherObject) dispatchers: DispatcherObject<unknown>[]) {
    dispatchers.forEach(dispatcher => {
      this.#dispatchers.set(dispatcher.channelName, dispatcher);
    });
  }

  init(): void {
    this.manager.onContextHealthStateChange(async (_state: ContextHealthState) => {
      await this.dispatch(CONTEXTS_HEALTHS);
    });
    this.manager.onOfflineChange(async () => {
      await this.dispatch(CONTEXTS_HEALTHS);
      await this.dispatch(RESOURCES_COUNT);
      await this.dispatch(ACTIVE_RESOURCES_COUNT);
    });
    this.manager.onContextPermissionResult(async (_permissions: ContextPermissionResult) => {
      await this.dispatch(CONTEXTS_PERMISSIONS);
    });
    this.manager.onContextDelete(async (_state: DispatcherEvent) => {
      await this.dispatch(CONTEXTS_HEALTHS);
      await this.dispatch(CONTEXTS_PERMISSIONS);
    });
    this.manager.onResourceCountUpdated(async () => {
      await this.dispatch(RESOURCES_COUNT);
    });
    this.manager.onResourceUpdated(async event => {
      await this.dispatch(UPDATE_RESOURCE, { contextName: event.contextName, resourceName: event.resourceName });
      await this.dispatch(ACTIVE_RESOURCES_COUNT);
    });
  }

  // TODO replace this with an event
  getTroubleshootingInformation(): KubernetesTroubleshootingInformation {
    return this.manager.getTroubleshootingInformation();
  }

  async dispatch(channel: RpcChannel<unknown>, options?: unknown): Promise<void> {
    const dispatcher = this.#dispatchers.get(channel.name);
    if (!dispatcher) {
      console.error(`dispatcher not found for channel ${channel.name}`);
      return;
    }
    await dispatcher.dispatch(options);
  }
}
