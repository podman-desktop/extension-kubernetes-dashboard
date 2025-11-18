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
import { RESOURCE_EVENTS, type ResourceEventsOptions, type ResourceEventsInfo } from '@kubernetes-dashboard/channels';

@injectable()
export class ResourceEventsDispatcher
  extends AbsDispatcherObjectImpl<ResourceEventsOptions[], ResourceEventsInfo>
  implements DispatcherObject<ResourceEventsOptions[]>
{
  constructor(@inject(ContextsManager) private manager: ContextsManager) {
    super(RESOURCE_EVENTS);
  }

  getData(options: ResourceEventsOptions[]): ResourceEventsInfo {
    return {
      events: options.map(option => ({
        events: this.manager.getResourceEvents(option.contextName, option.uid),
        contextName: option.contextName,
        uid: option.uid,
      })),
    };
  }
}
