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
import { AVAILABLE_CONTEXTS } from '@kubernetes-dashboard/channels';
import { ContextsManager } from '/@/manager/contexts-manager';
import type { AvailableContextsInfo } from '@podman-desktop/kubernetes-dashboard-extension-api';

@injectable()
export class AvailableContextsDispatcher
  extends AbsDispatcherObjectImpl<void, AvailableContextsInfo>
  implements DispatcherObject<void>
{
  constructor(@inject(ContextsManager) private manager: ContextsManager) {
    super(AVAILABLE_CONTEXTS);
  }

  getData(): AvailableContextsInfo {
    return {
      contextNames: this.manager.getContextsNames(),
    };
  }
}
