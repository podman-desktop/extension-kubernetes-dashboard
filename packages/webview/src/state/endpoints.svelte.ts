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

import { ENDPOINTS } from '/@common/index';
import { RpcBrowser } from '@podman-desktop/rpc';

import { AbsStateObjectImpl, type StateObject } from './util/state-object.svelte';
import type { EndpointsInfo } from '/@common/model/endpoints-info';
import type { EndpointsOptions } from '/@common/model/endpoints-options';

// Define a state for the EndpointsInfo
@injectable()
export class StateEndpointsInfo
  extends AbsStateObjectImpl<EndpointsInfo, EndpointsOptions>
  implements StateObject<EndpointsInfo, EndpointsOptions>
{
  constructor(@inject(RpcBrowser) rpcBrowser: RpcBrowser) {
    super(rpcBrowser);
  }

  async init(): Promise<void> {
    await this.initChannel(ENDPOINTS);
  }
}
