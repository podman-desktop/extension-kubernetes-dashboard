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
import type { DispatcherObject } from './util/dispatcher-object';
import { AbsDispatcherObjectImpl } from './util/dispatcher-object';
import { ContextsManager } from '/@/manager/contexts-manager';
import { RpcExtension } from '@kubernetes-dashboard/rpc-extension';
import { ACTIVE_RESOURCES_COUNT, type ActiveResourcesCountInfo } from '@kubernetes-dashboard/channels';

@injectable()
export class ActiveResourcesCountDispatcher
  extends AbsDispatcherObjectImpl<void, ActiveResourcesCountInfo>
  implements DispatcherObject<void>
{
  @inject(ContextsManager)
  private manager: ContextsManager;

  constructor(@inject(RpcExtension) rpcExtension: RpcExtension) {
    super(rpcExtension, ACTIVE_RESOURCES_COUNT);
  }

  getData(): ActiveResourcesCountInfo {
    return {
      counts: this.manager.getActiveResourcesCount(),
    };
  }
}
