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

import type { Disposable } from '@podman-desktop/api';

export interface AvailableContextsInfo {
  contextNames: string[];
}

export interface CurrentContextInfo {
  contextName?: string;
  namespace?: string;
}

/**
 * The subscriber for the events emitted by the Kubernetes Dashboard extension.
 */
export interface KubernetesDashboardSubscriber {
  onAvailableContexts(listener: (event: AvailableContextsInfo) => void): Disposable;
  onCurrentContext(listener: (event: CurrentContextInfo) => void): Disposable;
  /**
   * Disposes the subscriber and unsubscribes from all the events emitted by the Kubernetes Dashboard extension.
   */
  dispose(): void;
}

/**
 * The API for the Kubernetes Dashboard extension.
 *
 * How to use it from your extension:
 *
 * ```typescript
 * import * as extensionApi from '@podman-desktop/api';
 *
 * export async function activate(extensionContext: ExtensionContext): Promise<void> {
 *   const didChangeSubscription = extensionApi.extensions.onDidChange(() => {
 *    const api = extensionApi.extensions.getExtension<KubernetesDashboardExtensionApi>('redhat.kubernetes-dashboard')?.exports;
 *    if (api) {
 *      const subscriber = api.getSubscriber();
 *      // dispose the subscriber when the extension is deactivated
 *      extensionContext.subscriptions.push(subscriber);
 *      // stop being notified when the extension is changed
 *      didChangeSubscription.dispose();
 *    }
 *  });
 *  // stop being notified when the extension is deactivated
 *  extensionContext.subscriptions.push(didChangeSubscription);
 * }
 * ```
 */
export interface KubernetesDashboardExtensionApi {
  /**
   * Returns a subscriber for the events emitted by the Kubernetes Dashboard extension.
   *
   * The subscriber is used to subscribe to the events emitted by the Kubernetes Dashboard extension.
   */
  getSubscriber(): KubernetesDashboardSubscriber;
}
