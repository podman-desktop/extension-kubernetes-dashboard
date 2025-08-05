/**********************************************************************
 * Copyright (C) 2024 - 2025 Red Hat, Inc.
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

import { ApiException, KubeConfig, V1Status, type KubernetesObject, type ObjectCache } from '@kubernetes/client-node';

import type { ContextPermission } from '/@common/model/kubernetes-contexts-permissions.js';
import type { ResourceCount } from '/@common/model/kubernetes-resource-count.js';
import type { KubernetesTroubleshootingInformation } from '/@common/model/kubernetes-troubleshooting.js';
import { window } from '@podman-desktop/api';

import type { Event } from '/@/types/emitter.js';
import { Emitter } from '/@/types/emitter.js';
import { ConfigmapsResourceFactory } from '/@/resources/configmaps-resource-factory.js';
import type { ContextHealthState } from './context-health-checker.js';
import { ContextHealthChecker } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import { ContextPermissionsChecker } from './context-permissions-checker.js';
import { ContextResourceRegistry } from '/@/registry/context-resource-registry.js';
import type { CurrentChangeEvent, DispatcherEvent } from './contexts-dispatcher.js';
import { ContextsDispatcher } from './contexts-dispatcher.js';
import { CronjobsResourceFactory } from '/@/resources/cronjobs-resource-factory.js';
import { DeploymentsResourceFactory } from '/@/resources/deployments-resource-factory.js';
import { EventsResourceFactory } from '/@/resources/events-resource-factory.js';
import { IngressesResourceFactory } from '/@/resources/ingresses-resource-factory.js';
import { JobsResourceFactory } from '/@/resources/jobs-resource-factory.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import { NodesResourceFactory } from '/@/resources/nodes-resource-factory.js';
import { PodsResourceFactory } from '/@/resources/pods-resource-factory.js';
import { PVCsResourceFactory } from '/@/resources/pvcs-resource-factory.js';
import type { ResourceFactory } from '/@/resources/resource-factory.js';
import { ResourceFactoryHandler } from './resource-factory-handler.js';
import type { CacheUpdatedEvent, OfflineEvent, ResourceInformer } from '/@/types/resource-informer.js';
import { RoutesResourceFactory } from '/@/resources/routes-resource-factory.js';
import { SecretsResourceFactory } from '/@/resources/secrets-resource-factory.js';
import { ServicesResourceFactory } from '/@/resources/services-resource-factory.js';
import { injectable } from 'inversify';
import { ContextResourceItems } from '/@common/model/context-resources-items.js';
import { NamespacesResourceFactory } from '../resources/namespaces-resource-factory.js';
import { ContextResourceDetails } from '/@common/model/context-resources-details.js';

const HEALTH_CHECK_TIMEOUT_MS = 5_000;

/**
 * ContextsManager receives new KubeConfig updates
 * and manages the monitoring for each context of the KubeConfig.
 *
 * ContextsManager fire events when a context is deleted, and to forward the states of the health checkers, permission checkers and informers.
 *
 * ContextsManager exposes the current state of the health checkers, permission checkers and informers.
 */
@injectable()
export class ContextsManager {
  #resourceFactoryHandler: ResourceFactoryHandler;
  #dispatcher: ContextsDispatcher;
  #healthCheckers: Map<string, ContextHealthChecker>;
  #permissionsCheckers: ContextPermissionsChecker[];
  #informers: ContextResourceRegistry<ResourceInformer<KubernetesObject>>;
  #objectCaches: ContextResourceRegistry<ObjectCache<KubernetesObject>>;
  #currentContext?: KubeConfigSingleContext;
  #currentKubeConfig: KubeConfig;

  #onContextHealthStateChange = new Emitter<ContextHealthState>();
  onContextHealthStateChange: Event<ContextHealthState> = this.#onContextHealthStateChange.event;

  #onOfflineChange = new Emitter<void>();
  onOfflineChange: Event<void> = this.#onOfflineChange.event;

  #onContextPermissionResult = new Emitter<ContextPermissionResult>();
  onContextPermissionResult: Event<ContextPermissionResult> = this.#onContextPermissionResult.event;

  #onContextDelete = new Emitter<DispatcherEvent>();
  onContextDelete: Event<DispatcherEvent> = this.#onContextDelete.event;

  #onResourceUpdated = new Emitter<{ contextName: string; resourceName: string }>();
  onResourceUpdated: Event<{ contextName: string; resourceName: string }> = this.#onResourceUpdated.event;

  #onResourceCountUpdated = new Emitter<{ contextName: string; resourceName: string }>();
  onResourceCountUpdated: Event<{ contextName: string; resourceName: string }> = this.#onResourceCountUpdated.event;

  #onCurrentContextChange = new Emitter<void>();
  onCurrentContextChange: Event<void> = this.#onCurrentContextChange.event;

  constructor() {
    this.#currentKubeConfig = new KubeConfig();
    this.#resourceFactoryHandler = new ResourceFactoryHandler();
    for (const resourceFactory of this.getResourceFactories()) {
      this.#resourceFactoryHandler.add(resourceFactory);
    }
    // Add more resources here
    this.#healthCheckers = new Map<string, ContextHealthChecker>();
    this.#permissionsCheckers = [];
    this.#informers = new ContextResourceRegistry<ResourceInformer<KubernetesObject>>();
    this.#objectCaches = new ContextResourceRegistry<ObjectCache<KubernetesObject>>();
    this.#dispatcher = new ContextsDispatcher();
    this.#dispatcher.onUpdate(this.onUpdate.bind(this));
    this.#dispatcher.onDelete(this.onDelete.bind(this));
    this.#dispatcher.onDelete((state: DispatcherEvent) => this.#onContextDelete.fire(state));
    this.#dispatcher.onCurrentChange(this.onCurrentChange.bind(this));
  }

  get currentContext(): KubeConfigSingleContext | undefined {
    return this.#currentContext;
  }

  protected getResourceFactories(): ResourceFactory[] {
    return [
      new ConfigmapsResourceFactory(),
      new CronjobsResourceFactory(),
      new JobsResourceFactory(),
      new DeploymentsResourceFactory(),
      new EventsResourceFactory(),
      new IngressesResourceFactory(),
      new NamespacesResourceFactory(),
      new NodesResourceFactory(),
      new PodsResourceFactory(),
      new PVCsResourceFactory(),
      new RoutesResourceFactory(),
      new SecretsResourceFactory(),
      new ServicesResourceFactory(),
    ];
  }

  async update(kubeconfig: KubeConfig): Promise<void> {
    this.#currentKubeConfig = kubeconfig;
    this.#dispatcher.update(kubeconfig);
  }

  private async onUpdate(event: DispatcherEvent): Promise<void> {
    if (event.contextName === this.currentContext?.getKubeConfig().currentContext) {
      // the context being changed is the current one, we update the current context info
      this.#currentContext = event.config;
      this.#onCurrentContextChange.fire();
    }
    if (this.isMonitored(event.contextName)) {
      // we don't try to update the checkers, we recreate them
      return this.startMonitoring(event.config, event.contextName);
    }
  }

  private onDelete(state: DispatcherEvent): void {
    if (this.isMonitored(state.contextName)) {
      this.stopMonitoring(state.contextName);
    }
  }

  private async onCurrentChange(state: CurrentChangeEvent): Promise<void> {
    if (state.previous && this.isMonitored(state.previous)) {
      this.stopMonitoring(state.previous);
    }
    if (state.current && state.currentConfig) {
      await this.startMonitoring(state.currentConfig, state.current);
    }
    this.#currentContext = state.currentConfig;
    this.#onCurrentContextChange.fire();
  }

  private onStateChange(state: ContextHealthState): void {
    this.#onContextHealthStateChange.fire(state);
  }

  private onPermissionResult(event: ContextPermissionResult): void {
    this.#onContextPermissionResult.fire(event);
  }

  /* getHealthCheckersStates returns the current state of the health checkers */
  getHealthCheckersStates(): Map<string, ContextHealthState> {
    const result = new Map<string, ContextHealthState>();
    for (const [contextName, hc] of this.#healthCheckers.entries()) {
      result.set(contextName, hc.getState());
    }
    return result;
  }

  /* getPermissions returns the current permissions */
  getPermissions(): ContextPermission[] {
    return this.#permissionsCheckers.flatMap(permissionsChecker => permissionsChecker.getPermissions());
  }

  getResourcesCount(): ResourceCount[] {
    return this.#objectCaches.getAll().map(informer => ({
      contextName: informer.contextName,
      resourceName: informer.resourceName,
      count: informer.value.list().length,
    }));
  }

  // getActiveResourcesCount returns the count of filtered resources for each context/resource
  // when isActive is declared for a resource, and filtered with isActive
  getActiveResourcesCount(): ResourceCount[] {
    return this.#objectCaches
      .getAll()
      .map(informer => {
        const isActive = this.#resourceFactoryHandler.getResourceFactoryByResourceName(informer.resourceName)?.isActive;
        return isActive
          ? {
              contextName: informer.contextName,
              resourceName: informer.resourceName,
              count: informer.value.list().filter(isActive).length,
            }
          : undefined;
      })
      .filter(f => !!f);
  }

  getResources(contextNames: string[], resourceName: string): ContextResourceItems[] {
    return this.#objectCaches.getForContextsAndResource(contextNames, resourceName).map(({ contextName, value }) => {
      return {
        resourceName,
        contextName,
        items: value.list(),
      };
    });
  }

  getResourceDetails(
    contextName: string,
    resourceName: string,
    name: string,
    namespace?: string,
  ): ContextResourceDetails[] {
    return this.#objectCaches.getForContextsAndResource([contextName], resourceName).map(({ contextName, value }) => {
      return {
        resourceName,
        contextName,
        name,
        namespace,
        details: value.get(name, namespace),
      };
    });
  }

  /* dispose all disposable resources created by the instance */
  dispose(): void {
    this.disposeAllHealthChecks();
    this.disposeAllPermissionsCheckers();
    this.disposeAllInformers();
    this.#onContextHealthStateChange.dispose();
    this.#onContextDelete.dispose();
  }

  async refreshContextState(contextName: string): Promise<void> {
    try {
      const config = this.#dispatcher.getKubeConfigSingleContext(contextName);
      await this.startMonitoring(config, contextName);
    } catch (e: unknown) {
      console.warn(`unable to refresh context ${contextName}`, String(e));
    }
  }

  // disposeAllHealthChecks disposes all health checks and removes them from registry
  private disposeAllHealthChecks(): void {
    for (const [contextName, healthChecker] of this.#healthCheckers.entries()) {
      healthChecker.dispose();
      this.#healthCheckers.delete(contextName);
    }
  }

  // disposeAllPermissionsCheckers disposes all permissions checkers and removes them from registry
  private disposeAllPermissionsCheckers(): void {
    for (const permissionChecker of this.#permissionsCheckers) {
      permissionChecker.dispose();
    }
    this.#permissionsCheckers = [];
  }

  // disposeAllInformers disposes all informers and removes them from registry
  private disposeAllInformers(): void {
    for (const informer of this.#informers.getAll()) {
      informer.value.dispose();
    }
  }

  getTroubleshootingInformation(): KubernetesTroubleshootingInformation {
    return {
      healthCheckers: Array.from(this.#healthCheckers.values())
        .map(healthChecker => healthChecker.getState())
        .map(state => ({
          contextName: state.contextName,
          checking: state.checking,
          reachable: state.reachable,
        })),
      permissionCheckers: this.#permissionsCheckers.flatMap(permissionChecker => permissionChecker.getPermissions()),
      informers: this.#informers.getAll().map(informer => ({
        contextName: informer.contextName,
        resourceName: informer.resourceName,
        isOffline: informer.value.isOffline(),
        objectsCount: this.#objectCaches.get(informer.contextName, informer.resourceName)?.list().length,
      })),
    };
  }

  private isMonitored(contextName: string): boolean {
    return this.#healthCheckers.has(contextName);
  }

  protected async startMonitoring(config: KubeConfigSingleContext, contextName: string): Promise<void> {
    this.stopMonitoring(contextName);

    // register and start health checker
    const newHealthChecker = new ContextHealthChecker(config);
    this.#healthCheckers.set(contextName, newHealthChecker);
    newHealthChecker.onStateChange(this.onStateChange.bind(this));

    newHealthChecker.onReachable(async (state: ContextHealthState) => {
      // register and start permissions checker
      const previousPermissionsCheckers = this.#permissionsCheckers.filter(
        permissionChecker => permissionChecker.contextName === state.contextName,
      );
      for (const checker of previousPermissionsCheckers) {
        checker.dispose();
      }

      const namespace = state.kubeConfig.getNamespace();
      const permissionRequests = this.#resourceFactoryHandler.getPermissionsRequests(namespace);
      for (const permissionRequest of permissionRequests) {
        const newPermissionChecker = new ContextPermissionsChecker(
          state.kubeConfig,
          state.contextName,
          permissionRequest,
        );
        this.#permissionsCheckers.push(newPermissionChecker);
        newPermissionChecker.onPermissionResult(this.onPermissionResult.bind(this));

        newPermissionChecker.onPermissionResult((event: ContextPermissionResult) => {
          if (!event.permitted) {
            // if the user does not have watch permission, do not try to start informers on these resources
            return;
          }
          for (const resource of event.resources) {
            const contextName = event.kubeConfig.getKubeConfig().currentContext;
            const factory = this.#resourceFactoryHandler.getResourceFactoryByResourceName(resource);
            if (!factory) {
              throw new Error(
                `a permission for resource ${resource} has been received but no factory is handling it, this should not happen`,
              );
            }
            if (!factory.informer) {
              // no informer for this factory, skipping
              // (we may want to check permissions on some resource, without having to start an informer)
              continue;
            }
            const informer = factory.informer.createInformer(event.kubeConfig);
            this.#informers.set(contextName, resource, informer);
            informer.onCacheUpdated((e: CacheUpdatedEvent) => {
              this.#onResourceUpdated.fire({
                contextName: e.kubeconfig.getKubeConfig().currentContext,
                resourceName: e.resourceName,
              });
              if (e.countChanged) {
                this.#onResourceCountUpdated.fire({
                  contextName: e.kubeconfig.getKubeConfig().currentContext,
                  resourceName: e.resourceName,
                });
              }
            });
            informer.onOffline((e: OfflineEvent) => {
              this.#onOfflineChange.fire();
              this.#objectCaches.removeForContext(e.kubeconfig.getKubeConfig().currentContext);
            });
            const cache = informer.start();
            this.#objectCaches.set(contextName, resource, cache);
          }
        });
        await newPermissionChecker.start();
      }
    });
    await newHealthChecker.start({ timeout: HEALTH_CHECK_TIMEOUT_MS });
  }

  protected stopMonitoring(contextName: string): void {
    const healthChecker = this.#healthCheckers.get(contextName);
    healthChecker?.dispose();
    this.#healthCheckers.delete(contextName);
    const permissionsCheckers = this.#permissionsCheckers.filter(
      permissionChecker => permissionChecker.contextName === contextName,
    );
    for (const checker of permissionsCheckers) {
      checker.dispose();
    }
    this.#permissionsCheckers = this.#permissionsCheckers.filter(
      permissionChecker => permissionChecker.contextName !== contextName,
    );

    const contextInformers = this.#informers.getForContext(contextName);
    for (const informer of contextInformers) {
      informer.dispose();
    }
    this.#informers.removeForContext(contextName);
    this.#objectCaches.removeForContext(contextName);
  }

  // returns true if at least one informer for the context is 'offline'
  // meaning that it has lost connection with the cluster (after being connected)
  isContextOffline(contextName: string): boolean {
    const informers = this.#informers.getForContext(contextName);
    return informers.some(informer => informer.isOffline());
  }

  async deleteObject(kind: string, name: string, namespace?: string): Promise<void> {
    const result = await window.showInformationMessage(
      `Are you sure you want to delete ${kind} ${name}?`,
      'Yes',
      'Cancel',
    );
    if (result !== 'Yes') {
      return;
    }

    await this.deleteObjectInternal(kind, name, namespace);
  }

  private async deleteObjectInternal(kind: string, name: string, namespace?: string): Promise<void> {
    if (!this.currentContext) {
      console.warn('delete object: no current context');
      return;
    }

    const handler = this.#resourceFactoryHandler.getResourceFactoryByKind(kind);
    if (!handler?.deleteObject) {
      console.error(`delete object: no handler for kind ${kind}`);
      return;
    }

    const ns = namespace ?? this.currentContext.getNamespace();
    try {
      const result = await handler.deleteObject(this.currentContext, name, ns);
      this.handleResult(result);
    } catch (error: unknown) {
      this.handleApiException(error);
    }
  }

  private handleResult(result: KubernetesObject | V1Status): void {
    if (this.isV1Status(result)) {
      this.handleStatus(result);
    }
    // Ignore if result is a KubernetesObject
  }

  private handleApiException(error: unknown): void {
    if (error instanceof ApiException) {
      const statusError = error as ApiException<string>;
      let status: unknown;
      try {
        status = JSON.parse(statusError.body);
      } catch {
        throw error;
      }
      if (this.isV1Status(status)) {
        this.handleStatus(status);
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  private isV1Status(status: unknown): status is V1Status {
    return (
      !!status &&
      typeof status === 'object' &&
      'kind' in status &&
      typeof status.kind === 'string' &&
      status.kind === 'Status'
    );
  }

  protected handleStatus(_status: V1Status): void {
    // TODO: https://github.com/podman-desktop/extension-kubernetes-dashboard/issues/103
  }

  async deleteObjects(objects: { kind: string; name: string; namespace?: string }[]): Promise<void> {
    const message = this.getTextualObjectsList(objects);
    const result = await window.showInformationMessage(`Are you sure you want to delete ${message}?`, 'Yes', 'Cancel');
    if (result !== 'Yes') {
      return;
    }
    for (const object of objects) {
      try {
        await this.deleteObjectInternal(object.kind, object.name, object.namespace);
      } catch {
        // do nothing here:
        // - we don't want to stop the deletion of other objects
        // - the error is already handled by deleteObjectInternal
      }
    }
  }

  protected getTextualObjectsList(objects: { kind: string; name: string; namespace?: string }[]): string {
    const objectsToDelete = objects.reduce(
      (prev, curr) => {
        if (prev[curr.kind]) {
          prev[curr.kind]++;
        } else {
          prev[curr.kind] = 1;
        }
        return prev;
      },
      {} as Record<string, number>,
    );
    return Object.entries(objectsToDelete)
      .map(([kind, count]) => `${count} ${this.getPluralized(count, kind)}`)
      .join(', ');
  }

  protected getPluralized(count: number, kind: string): string {
    // this may be provided by the resource factory in the future
    // https://github.com/podman-desktop/extension-kubernetes-dashboard/issues/128
    if (count === 1) {
      return kind;
    }
    if (kind.endsWith('s')) {
      return kind + 'es';
    }
    return kind + 's';
  }

  async setCurrentNamespace(namespace: string): Promise<void> {
    // Update state with a copy of the kubeConfig with only the current namespace changed
    const newConfig = new KubeConfig();
    newConfig.loadFromOptions({
      contexts: this.#currentKubeConfig.contexts.map(ctx =>
        ctx.name !== this.#currentKubeConfig.currentContext
          ? ctx
          : {
              name: ctx.name,
              cluster: ctx.cluster,
              namespace: namespace,
              user: ctx.user,
            },
      ),
      clusters: this.#currentKubeConfig.clusters,
      users: this.#currentKubeConfig.users,
      currentContext: this.#currentKubeConfig.currentContext,
    });
    await this.update(newConfig);
  }
}
