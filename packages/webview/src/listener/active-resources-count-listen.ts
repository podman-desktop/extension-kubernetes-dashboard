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

import type { ResourceCount } from '/@common/model/kubernetes-resource-count';
import type { IDisposable } from '/@common/model/disposable';
import { getContext } from 'svelte';
import type { RpcBrowser } from '/@common/rpc/rpc';
import { ACTIVE_RESOURCES_COUNT, API_DASHBOARD } from '/@common/channels';

// listenActiveResourcesCount listens the count of active resources
export async function listenActiveResourcesCount(
  callback: (activeResourcesCounts: ResourceCount[]) => void,
): Promise<IDisposable | undefined> {
  const rpcBrowser = getContext<RpcBrowser>('RpcBrowser');
  const disposable = rpcBrowser.on(ACTIVE_RESOURCES_COUNT, () => {
    collectAndSendCount(rpcBrowser, callback);
  });

  collectAndSendCount(rpcBrowser, callback);

  return {
    dispose: (): void => {
      disposable.dispose();
    },
  };
}

function collectAndSendCount(rpcBrowser: RpcBrowser, callback: (activeResourcesCount: ResourceCount[]) => void): void {
  const rpcDashboardClient = rpcBrowser.getProxy(API_DASHBOARD);
  rpcDashboardClient
    .getActiveResourcesCount()
    .then(result => {
      callback(result);
    })
    .catch(() => {
      console.error(`error getting active resources counts`);
    });
}
