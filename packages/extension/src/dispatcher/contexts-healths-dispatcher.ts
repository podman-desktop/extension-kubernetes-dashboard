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
import { CONTEXTS_HEALTHS } from '/@common/index';
import { ContextHealth } from '/@common/model/kubernetes-contexts-healths';
import { RpcExtension } from '@podman-desktop/rpc';
import { ContextsHealthsInfo } from '/@common/model/contexts-healths-info';

@injectable()
export class ContextsHealthsDispatcher
  extends AbsDispatcherObjectImpl<void, ContextsHealthsInfo>
  implements DispatcherObject<void>
{
  constructor(
    @inject(RpcExtension) rpcExtension: RpcExtension,
    @inject(ContextsManager) private manager: ContextsManager,
  ) {
    super(rpcExtension, CONTEXTS_HEALTHS);
  }

  getData(): ContextsHealthsInfo {
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
    return {
      healths: value,
    };
  }
}
