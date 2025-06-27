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

import type { ExtensionContext } from '@podman-desktop/api';

import { DashboardExtension } from './dashboard-extension';
import { ContextsManager } from './manager/contexts-manager';
import { ContextsStatesDispatcher } from './manager/contexts-states-dispatcher';

let dashboardExtension: DashboardExtension | undefined;

// Initialize the activation of the extension.
export async function activate(extensionContext: ExtensionContext): Promise<void> {
  const contextsManager = new ContextsManager();
  const apiSender = {
    send: (channel: string, data?: unknown): void => {
      console.log(`==> recv data "${data}" on channel ${channel}`);
    },
  };
  const contextsStatesDispatcher = new ContextsStatesDispatcher(contextsManager, apiSender);
  dashboardExtension ??= new DashboardExtension(extensionContext, contextsManager, contextsStatesDispatcher);

  await dashboardExtension.activate();
}

export async function deactivate(): Promise<void> {
  await dashboardExtension?.deactivate();
  dashboardExtension = undefined;
}

// Expose dashboardExtension for testing purposes
if (process.env.NODE_ENV === 'test') {
  Object.defineProperty(global, 'dashboardExtension', {
    get: () => dashboardExtension,
  });
}
