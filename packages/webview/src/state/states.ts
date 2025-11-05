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
import { StateActiveResourcesCountInfo } from './active-resources-count.svelte';
import { StateAvailableContextsInfo } from './available-contexts.svelte';
import { StateContextsHealthsInfo } from './contexts-healths.svelte';
import { StateContextsPermissionsInfo } from './contexts-permissions.svelte';
import { StateCurrentContextInfo } from './current-context.svelte';
import { StateEditorSettingsInfo } from './editor-settings.svelte';
import { StateEndpointsInfo } from './endpoints.svelte';
import { StateKubernetesProvidersInfo } from './kubernetes-providers.svelte';
import { StatePortForwardsInfo } from './port-forwards.svelte';
import { StateResourceDetailsInfo } from './resource-details.svelte';
import { StateResourceEventsInfo } from './resource-events.svelte';
import { StateResourcesCountInfo } from './resources-count.svelte';
import { StateUpdateResourceInfo } from './update-resource.svelte';

@injectable()
export class States {
  @inject(StateResourcesCountInfo)
  private _stateResourcesCountInfoUI: StateResourcesCountInfo;

  get stateResourcesCountInfoUI(): StateResourcesCountInfo {
    return this._stateResourcesCountInfoUI;
  }

  @inject(StateActiveResourcesCountInfo)
  private _stateActiveResourcesCountInfoUI: StateActiveResourcesCountInfo;

  get stateActiveResourcesCountInfoUI(): StateActiveResourcesCountInfo {
    return this._stateActiveResourcesCountInfoUI;
  }

  @inject(StateCurrentContextInfo)
  private _stateCurrentContextInfoUI: StateCurrentContextInfo;

  get stateCurrentContextInfoUI(): StateCurrentContextInfo {
    return this._stateCurrentContextInfoUI;
  }

  @inject(StateAvailableContextsInfo)
  private _stateAvailableContextsInfoUI: StateAvailableContextsInfo;

  get stateAvailableContextsInfoUI(): StateAvailableContextsInfo {
    return this._stateAvailableContextsInfoUI;
  }

  @inject(StateUpdateResourceInfo)
  private _stateUpdateResourceInfoUI: StateUpdateResourceInfo;

  get stateUpdateResourceInfoUI(): StateUpdateResourceInfo {
    return this._stateUpdateResourceInfoUI;
  }

  @inject(StateResourceDetailsInfo)
  private _stateResourceDetailsInfoUI: StateResourceDetailsInfo;

  get stateResourceDetailsInfoUI(): StateResourceDetailsInfo {
    return this._stateResourceDetailsInfoUI;
  }

  @inject(StateContextsPermissionsInfo)
  private _stateContextsPermissionsInfoUI: StateContextsPermissionsInfo;

  get stateContextsPermissionsInfoUI(): StateContextsPermissionsInfo {
    return this._stateContextsPermissionsInfoUI;
  }

  @inject(StateContextsHealthsInfo)
  private _stateContextsHealthsInfoUI: StateContextsHealthsInfo;

  get stateContextsHealthsInfoUI(): StateContextsHealthsInfo {
    return this._stateContextsHealthsInfoUI;
  }

  @inject(StateResourceEventsInfo)
  private _stateResourceEventsInfoUI: StateResourceEventsInfo;

  get stateResourceEventsInfoUI(): StateResourceEventsInfo {
    return this._stateResourceEventsInfoUI;
  }

  @inject(StatePortForwardsInfo)
  private _statePortForwardsInfoUI: StatePortForwardsInfo;

  get statePortForwardsInfoUI(): StatePortForwardsInfo {
    return this._statePortForwardsInfoUI;
  }

  @inject(StateEditorSettingsInfo)
  private _stateEditorSettingsInfoUI: StateEditorSettingsInfo;

  get stateEditorSettingsInfoUI(): StateEditorSettingsInfo {
    return this._stateEditorSettingsInfoUI;
  }

  @inject(StateEndpointsInfo)
  private _stateEndpointsInfoUI: StateEndpointsInfo;

  get stateEndpointsInfoUI(): StateEndpointsInfo {
    return this._stateEndpointsInfoUI;
  }

  @inject(StateKubernetesProvidersInfo)
  private _stateKubernetesProvidersInfoUI: StateKubernetesProvidersInfo;

  get stateKubernetesProvidersInfoUI(): StateKubernetesProvidersInfo {
    return this._stateKubernetesProvidersInfoUI;
  }
}
