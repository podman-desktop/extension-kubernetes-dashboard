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

/**
 * Patch strategy for Kubernetes resource operations.
 *
 * - `'json-patch'` — `application/json-patch+json` (RFC 6902)
 * - `'merge-patch'` — `application/merge-patch+json` (RFC 7386)
 * - `'strategic-merge-patch'` — `application/strategic-merge-patch+json` (Kubernetes-specific)
 * - `'server-side-apply'` — `application/apply-patch+yaml` (server-side field management)
 */
export type PatchStrategyType = 'json-patch' | 'merge-patch' | 'strategic-merge-patch' | 'server-side-apply';

export interface PatchResourcesOptions {
  /**
   * The patch strategy to use. Defaults to `'strategic-merge-patch'`.
   */
  strategy?: PatchStrategyType;
  /**
   * The field manager name for server-side field ownership tracking.
   * Defaults to `'kubernetes-dashboard'`.
   */
  fieldManager?: string;
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
 * Options for subscribing to resource updates.
 */
export interface ResourceUpdateOptions {
  /**
   * The resource name to subscribe to (e.g., 'pods', 'deployments', 'services').
   */
  resourceName: string;
  /**
   * The context name to subscribe to. If not set, defaults to the current context.
   */
  contextName?: string;
}

/**
 * A Kubernetes resource object.
 * Consumer extensions should cast items to specific types from `@kubernetes/client-node`
 * (e.g., `items as V1Pod[]` for `'pods'` resources).
 */
export interface KubernetesObject {
  apiVersion?: string;
  kind?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Resource items for a specific context and resource type.
 */
export interface ContextResourceItems {
  contextName?: string;
  resourceName: string;
  items: readonly KubernetesObject[];
}

/**
 * The payload for resource update events.
 */
export interface ResourceUpdateInfo {
  resources: ContextResourceItems[];
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
   * Subscribes to the events emitted every time the resources of the specified type are updated.
   *
   * The listener receives the full list of resources for the specified resource type and context.
   * An initial event is emitted immediately with the current cached data.
   *
   * Consumer extensions should cast the received items to specific types from `@kubernetes/client-node`
   * (e.g., `items as V1Pod[]` for `'pods'` resources).
   */
  onResourceUpdate(options: ResourceUpdateOptions, listener: (event: ResourceUpdateInfo) => void): Disposable;

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

  /**
   * Patches Kubernetes resources.
   *
   * Accepts one or more YAML documents (separated by `---`) describing the resources to patch.
   * Each resource must have `apiVersion`, `kind`, and `metadata.name` set.
   *
   * @param yamlDocuments - The YAML documents describing the resources to patch.
   * @param options - Options controlling patch strategy and field manager.
   */
  patchResources(yamlDocuments: string, options?: PatchResourcesOptions): Promise<void>;

  /**
   * Deletes a Kubernetes resource.
   *
   * @param kind - The kind of the resource to delete (e.g., 'Pod', 'Deployment').
   * @param name - The name of the resource to delete.
   * @param namespace - The namespace of the resource. If not set, defaults to the current namespace.
   */
  deleteResource(kind: string, name: string, namespace?: string): Promise<void>;

  /**
   * Patches a Kubernetes subresource using a merge patch.
   *
   * Builds the subresource URL from the provided parameters and sends a raw HTTP PATCH
   * with content-type `application/merge-patch+json`.
   *
   * @param apiVersion - The API version (e.g., 'v1', 'certificates.k8s.io/v1').
   * @param resource - The resource plural name (e.g., 'pods', 'certificatesigningrequests').
   * @param name - The name of the resource.
   * @param subresource - The subresource to patch (e.g., 'status', 'approval', 'scale').
   * @param body - The patch body object.
   * @param namespace - The namespace of the resource. Omit for cluster-scoped resources.
   */
  patchSubresource(
    apiVersion: string,
    resource: string,
    name: string,
    subresource: string,
    body: object,
    namespace?: string,
  ): Promise<void>;

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
