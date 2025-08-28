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

import { States } from './states';
import { StateObject } from './util/state-object.svelte';
import { IDisposable } from '/@common/types/disposable';
import { StateResourcesCountInfo } from './resources-count.svelte';
import { StateActiveResourcesCountInfo } from './active-resources-count.svelte';
import { StateCurrentContextInfo } from './current-context.svelte';
import { StateUpdateResourceInfo } from './update-resource.svelte';
import { StateContextsPermissionsInfo } from './contexts-permissions.svelte';
import { StateContextsHealthsInfo } from './contexts-healths.svelte';
import { StateResourceDetailsInfo } from './resource-details.svelte';
import { StateResourceEventsInfo } from './resource-events.svelte';
import { StatePortForwardsInfo } from './port-forwards.svelte';

const statesModule = new ContainerModule(options => {
  options.bind(States).toSelf().inSingletonScope();

  options.bind(StateResourcesCountInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateResourcesCountInfo);
  options.bind(IDisposable).toService(StateResourcesCountInfo);

  options.bind(StateActiveResourcesCountInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateActiveResourcesCountInfo);
  options.bind(IDisposable).toService(StateActiveResourcesCountInfo);

  options.bind(StateCurrentContextInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateCurrentContextInfo);
  options.bind(IDisposable).toService(StateCurrentContextInfo);

  options.bind(StateUpdateResourceInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateUpdateResourceInfo);
  options.bind(IDisposable).toService(StateUpdateResourceInfo);

  options.bind(StateResourceDetailsInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateResourceDetailsInfo);
  options.bind(IDisposable).toService(StateResourceDetailsInfo);

  options.bind(StateContextsPermissionsInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateContextsPermissionsInfo);
  options.bind(IDisposable).toService(StateContextsPermissionsInfo);

  options.bind(StateContextsHealthsInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateContextsHealthsInfo);
  options.bind(IDisposable).toService(StateContextsHealthsInfo);

  options.bind(StateResourceEventsInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StateResourceEventsInfo);
  options.bind(IDisposable).toService(StateResourceEventsInfo);

  options.bind(StatePortForwardsInfo).toSelf().inSingletonScope();
  options.bind(StateObject).toService(StatePortForwardsInfo);
  options.bind(IDisposable).toService(StatePortForwardsInfo);
});

export { statesModule };
