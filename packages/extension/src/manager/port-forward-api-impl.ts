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
import {
  type DeletePortForwardOptions,
  type PortForwardApi,
  type ForwardConfig,
  type ForwardOptions,
} from '@kubernetes-dashboard/channels';
import { PortForwardService, PortForwardServiceProvider } from '/@/port-forward/port-forward-service';

@injectable()
export class PortForwardApiImpl implements PortForwardApi {
  @inject(PortForwardServiceProvider)
  private portForwardServiceProvider: PortForwardServiceProvider;

  // PortForwardAPi interface implementation
  async createPortForward(config: ForwardOptions): Promise<void> {
    const service = this.ensurePortForwardService();
    const newConfig = await service.createForward(config);
    try {
      await service.startForward(newConfig);
    } catch (err: unknown) {
      await service.deleteForward(newConfig);
      throw err;
    }
  }

  async deletePortForward(config: ForwardConfig, options?: DeletePortForwardOptions): Promise<void> {
    return this.ensurePortForwardService().deleteForward(config, options);
  }

  getPortForwards(): ForwardConfig[] {
    return this.ensurePortForwardService().listForwards();
  }

  protected ensurePortForwardService(): PortForwardService {
    return this.portForwardServiceProvider.getService();
  }
}
