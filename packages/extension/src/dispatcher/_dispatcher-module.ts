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
import { ActiveResourcesCountDispatcher } from './active-resources-count-dispatcher';
import { ContextsHealthsDispatcher } from './contexts-healths-dispatcher';
import { ContextsPermissionsDispatcher } from './contexts-permissions-dispatcher';
import { ResourcesCountDispatcher } from './resources-count-dispatcher';
import { DispatcherObject } from './util/dispatcher-object';
import { CurrentContextDispatcher } from './current-context-dispatcher';
import { UpdateResourceDispatcher } from './update-resource-dispatcher';
import { ResourceDetailsDispatcher } from './resource-details-dispatcher';
import { ResourceEventsDispatcher } from './resource-events-dispatcher';
import { PortForwardsDispatcher } from './port-forwards-dispatcher';

const dispatchersModule = new ContainerModule(options => {
  options.bind<ActiveResourcesCountDispatcher>(ActiveResourcesCountDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ActiveResourcesCountDispatcher);

  options.bind<ContextsHealthsDispatcher>(ContextsHealthsDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ContextsHealthsDispatcher);

  options.bind<ContextsPermissionsDispatcher>(ContextsPermissionsDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ContextsPermissionsDispatcher);

  options.bind<ResourcesCountDispatcher>(ResourcesCountDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ResourcesCountDispatcher);

  options.bind<CurrentContextDispatcher>(CurrentContextDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(CurrentContextDispatcher);

  options.bind<UpdateResourceDispatcher>(UpdateResourceDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(UpdateResourceDispatcher);

  options.bind<ResourceDetailsDispatcher>(ResourceDetailsDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ResourceDetailsDispatcher);

  options.bind<ResourceEventsDispatcher>(ResourceEventsDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(ResourceEventsDispatcher);

  options.bind<PortForwardsDispatcher>(PortForwardsDispatcher).toSelf().inSingletonScope();
  options.bind(DispatcherObject).toService(PortForwardsDispatcher);
});

export { dispatchersModule };
