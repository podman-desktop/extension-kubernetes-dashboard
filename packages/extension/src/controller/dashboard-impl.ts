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

import type { ContextsStatesDispatcher } from '../manager/contexts-states-dispatcher';
import { API_DASHBOARD } from '/@common/channels';
import type { DashboardApi } from '/@common/interface/dashboard-api';
import type { ResourceCount } from '/@common/model/kubernetes-resource-count';
import type { RpcChannel } from '/@common/rpc';

export class DashboardImpl implements DashboardApi {
  constructor(private contextsStatesDispatcher: ContextsStatesDispatcher) {}

  getChannel(): RpcChannel<DashboardApi> {
    return API_DASHBOARD;
  }

  async getActiveResourcesCount(): Promise<ResourceCount[]> {
    return this.contextsStatesDispatcher.getActiveResourcesCount();
  }
}
