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

import { RpcBrowser } from '/@common/rpc/rpc';

import { InversifyBinding } from './inject/inversify-binding';
import { IDisposable } from '/@common/types/disposable';
import { States } from './state/states';
import { StateObject } from './state/util/state-object.svelte';
import type { WebviewApi } from '@podman-desktop/webview-api';
import { Remote } from './remote/remote';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

export interface MainContext {
  states: States;
  webviewApi: WebviewApi;
  remote: Remote;
  dependencyAccessor: DependencyAccessor;
}

export class Main implements IDisposable {
  private disposables: IDisposable[] = [];

  async init(): Promise<MainContext> {
    const webviewApi = acquirePodmanDesktopApi();

    const rpcBrowser: RpcBrowser = new RpcBrowser(window, webviewApi);

    const inversifyBinding = new InversifyBinding(rpcBrowser, webviewApi);
    const container = await inversifyBinding.initBindings();

    // Grab all state object instances
    const stateObjectInstances = container.getAll<StateObject<unknown, unknown>>(StateObject);

    // Init all state object instances
    for (const stateObjectInstance of stateObjectInstances) {
      await stateObjectInstance.init();
    }

    // Register all disposables
    const disposables = await container.getAllAsync<IDisposable>(IDisposable);
    this.disposables.push(...disposables);

    const mainContext: MainContext = {
      states: await container.getAsync<States>(States),
      webviewApi,
      remote: container.get<Remote>(Remote),
      dependencyAccessor: new DependencyAccessor(container),
    };

    return mainContext;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
