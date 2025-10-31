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
import { KubernetesProvidersInfo } from '@kubernetes-dashboard/channels/dist/model/kubernetes-providers-info';
import { KUBERNETES_PROVIDERS } from '@kubernetes-dashboard/channels';
import { KubernetesProvidersManager } from '/@/manager/kubernetes-providers';

@injectable()
export class KubernetesProvidersDispatcher
  extends AbsDispatcherObjectImpl<void, KubernetesProvidersInfo>
  implements DispatcherObject<void>
{
  constructor(
    @inject(ContextsManager) private manager: ContextsManager,
    @inject(KubernetesProvidersManager) private kubernetesProvidersManager: KubernetesProvidersManager,
  ) {
    super(KUBERNETES_PROVIDERS);
  }

  getData(): KubernetesProvidersInfo {
    return {
      providers: this.kubernetesProvidersManager.getKubernetesProviders(),
    };
  }
}
