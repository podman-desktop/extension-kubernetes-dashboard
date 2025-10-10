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

import { RESOURCE_EVENTS } from '/@common/index';
import { RpcBrowser } from '@kubernetes-dashboard/rpc';

import { AbsStateObjectImpl, type StateObject } from './util/state-object.svelte';
import type { ResourceEventsInfo } from '/@common/model/resource-events-info';
import type { ResourceEventsOptions } from '/@common/model/resource-events-options';

// Define a state for the ResourceEventsInfo
@injectable()
export class StateResourceEventsInfo
  extends AbsStateObjectImpl<ResourceEventsInfo, ResourceEventsOptions>
  implements StateObject<ResourceEventsInfo, ResourceEventsOptions>
{
  constructor(@inject(RpcBrowser) rpcBrowser: RpcBrowser) {
    super(rpcBrowser);
  }

  async init(): Promise<void> {
    await this.initChannel(RESOURCE_EVENTS);
  }
}
