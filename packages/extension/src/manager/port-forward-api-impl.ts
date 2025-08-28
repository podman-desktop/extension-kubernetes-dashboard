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

import { injectable } from 'inversify';
import { PortForwardApi } from '/@common/interface/port-forward-api';
import { ForwardConfig, ForwardOptions } from '/@common/model/port-forward';

@injectable()
export class PortForwardApiImpl implements PortForwardApi {
  // PortForwardAPi interface implementation
  createPortForward(_config: ForwardOptions): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deletePortForward(_config: ForwardConfig): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getPortForwards(): ForwardConfig[] {
    return [];
  }
}
