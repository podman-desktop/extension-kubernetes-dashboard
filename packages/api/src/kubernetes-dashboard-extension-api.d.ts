/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

export interface ContextHealth {
  contextName: string;
  // is the health of the cluster being checked?
  checking: boolean;
  // was the health check successful?
  reachable: boolean;
  // is one of the informers marked offline (disconnect after being connected, the cache still being populated)
  offline: boolean;
  // description in case of error (other than health check)
  // currently detected errors:
  // - user.exec.command not found
  errorMessage?: string;
}

export interface ContextsHealthsInfo {
  healths: ContextHealth[];
}

export interface ContextPermission {
  contextName: string;
  // the resource name is a generic string type and not a string literal type, as we want to handle CRDs names
  resourceName: string;
  // permitted if allowed and not denied
  // > When multiple authorization modules are configured, each is checked in sequence.
  // > If any authorizer approves or denies a request, that decision is immediately returned
  // > and no other authorizer is consulted. If all modules have no opinion on the request,
  // > then the request is denied. An overall deny verdict means that the API server rejects
  // > the request and responds with an HTTP 403 (Forbidden) status.
  // (source: https://kubernetes.io/docs/reference/access-authn-authz/authorization/)
  permitted: boolean;
  // A free-form and optional text reason for the resource being allowed or denied.
  // We cannot rely on having a reason for every request.
  // For exemple on Kind cluster, a reason is given only when the access is allowed, no reason is done for denial.
  reason?: string;
}

export interface ContextsPermissionsInfo {
  permissions: ContextPermission[];
}

export interface ResourceCount {
  contextName: string;
  resourceName: string;
  count: number;
}

export interface ResourcesCountInfo {
  counts: ResourceCount[];
}

/**
 * The subscriber for the events emitted by the Kubernetes Dashboard extension.
 */
export interface KubernetesDashboardSubscriber {
  /**
   * Subscribes to the events emitted every time the health of the contexts changes.
   */
  onContextsHealth(listener: (event: ContextsHealthsInfo) => void): Disposable;

  /**
   * Subscribes to the events emitted every time the permissions of the contexts change.
   */
  onContextsPermissions(listener: (event: ContextsPermissionsInfo) => void): Disposable;

  /**
   * Subscribes to the events emitted every time the resources count changes.
   */
  onResourcesCount(listener: (event: ResourcesCountInfo) => void): Disposable;

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
 *    const api = extensionApi.extensions.getExtension<KubernetesDashboardExtensionApi>('podman-desktop.kubernetes-dashboard')?.exports;
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

  readonly contexts: typeof contexts;
}

/**
 * Options for the connect operation.
 */
export interface ConnectOptions {
  /**
   * The resources (pods, deployments, etc) to connect to. By default, connects to all resources managed by the Dashboard extension.
   */
  resources?: string[];
}

/**
 * Namespace for Kubernetes contexts operations.
 */
export namespace contexts {
  /**
   * Connects to a Kubernetes context.
   *
   * @param contextName - The name of the context to connect to.
   * @param options - The options for the connect operation.
   */
  export function connect(contextName: string, options?: ConnectOptions): Promise<void>;
}
