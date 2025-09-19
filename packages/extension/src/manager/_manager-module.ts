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

import { ContainerModule } from 'inversify';

import { ContextsManager } from './contexts-manager';
import { ContextsStatesDispatcher } from './contexts-states-dispatcher';
import { SystemApiImpl } from './system-api';
import { PortForwardApiImpl } from './port-forward-api-impl';
import { PodLogsApiImpl } from './pod-logs-api-impl';
import { IDisposable } from '/@common/types/disposable';

const managersModule = new ContainerModule(options => {
  options.bind<ContextsManager>(ContextsManager).toSelf().inSingletonScope();
  options.bind<ContextsStatesDispatcher>(ContextsStatesDispatcher).toSelf().inSingletonScope();
  options.bind<SystemApiImpl>(SystemApiImpl).toSelf().inSingletonScope();
  options.bind<PortForwardApiImpl>(PortForwardApiImpl).toSelf().inSingletonScope();
  options.bind<PodLogsApiImpl>(PodLogsApiImpl).toSelf().inSingletonScope();

  // Bind IDisposable to services which need to clear data/stop connection/etc when the panel is left
  // (the onDestroy are not called from components when the panel is left, which may introduce memory leaks if not disposed here)
  options.bind(IDisposable).toService(PodLogsApiImpl);
});

export { managersModule };
