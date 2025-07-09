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
import { CURRENT_CONTEXT } from '/@common/channels';
import { RpcExtension } from '/@common/rpc/rpc';
import { CurrentContextInfo } from '/@common/model/current-context-info';
import { ContextsManager } from '/@/manager/contexts-manager';

@injectable()
export class CurrentContextDispatcher
  extends AbsDispatcherObjectImpl<void, CurrentContextInfo>
  implements DispatcherObject<void>
{
  @inject(ContextsManager)
  private manager: ContextsManager;

  constructor(@inject(RpcExtension) rpcExtension: RpcExtension) {
    super(rpcExtension, CURRENT_CONTEXT);
  }

  getData(): CurrentContextInfo {
    return {
      contextName: this.manager.currentContext?.getKubeConfig().currentContext,
    };
  }
}
