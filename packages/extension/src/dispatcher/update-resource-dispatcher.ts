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
import { UPDATE_RESOURCE } from '/@common/channels';
import { RpcExtension } from '/@common/rpc/rpc';
import { UpdateResourceInfo } from '/@common/model/update-resource-info';
import { UpdateResourceOptions } from '/@common/model/update-resource-options';

@injectable()
export class UpdateResourceDispatcher
  extends AbsDispatcherObjectImpl<UpdateResourceOptions[], UpdateResourceInfo>
  implements DispatcherObject<UpdateResourceOptions[]>
{
  @inject(ContextsManager)
  private manager: ContextsManager;

  constructor(@inject(RpcExtension) rpcExtension: RpcExtension) {
    super(rpcExtension, UPDATE_RESOURCE);
  }

  getData(options: UpdateResourceOptions[]): UpdateResourceInfo {
    return {
      resources: options.flatMap(option => this.manager.getResources([option.contextName], option.resourceName)),
    };
  }
}
