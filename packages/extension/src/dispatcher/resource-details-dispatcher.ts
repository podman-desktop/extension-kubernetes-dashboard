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
import { RESOURCE_DETAILS, type ResourceDetailsInfo, type ResourceDetailsOptions } from '@kubernetes-dashboard/channels';
import { RpcExtension } from '@kubernetes-dashboard/rpc';

@injectable()
export class ResourceDetailsDispatcher
  extends AbsDispatcherObjectImpl<ResourceDetailsOptions[], ResourceDetailsInfo>
  implements DispatcherObject<ResourceDetailsOptions[]>
{
  constructor(
    @inject(RpcExtension) rpcExtension: RpcExtension,
    @inject(ContextsManager) private manager: ContextsManager,
  ) {
    super(rpcExtension, RESOURCE_DETAILS);
  }

  getData(options: ResourceDetailsOptions[]): ResourceDetailsInfo {
    return {
      resources: options.map(option => ({
        details: this.manager.getResourceDetails(
          option.contextName,
          option.resourceName,
          option.name,
          option.namespace,
        ),
        resourceName: option.resourceName,
        contextName: option.contextName,
        name: option.name,
        namespace: option.namespace,
      })),
    };
  }
}
