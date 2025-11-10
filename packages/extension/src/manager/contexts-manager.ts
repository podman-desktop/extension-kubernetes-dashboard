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

import {
  ApiException,
  CoreV1Event,
  KubeConfig,
  KubernetesObjectApi,
  loadAllYaml,
  PatchStrategy,
  V1Ingress,
  V1Status,
  type KubernetesObject,
  type ObjectCache,
} from '@kubernetes/client-node';

import type {
  IDisposable,
  TargetRef,
  Endpoint,
  V1Route,
  ResourceCount,
  KubernetesTroubleshootingInformation,
} from '@kubernetes-dashboard/channels';
import { kubernetes, window } from '@podman-desktop/api';
import * as jsYaml from 'js-yaml';

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
import type { ResourceFactory, SelectorOptions } from '/@/resources/resource-factory.js';
import { ResourceFactoryHandler } from '/@/manager/resource-factory-handler.js';
import type {
  CacheUpdatedEvent,
  ObjectDeletedEvent,
  OfflineEvent,
  ResourceInformer,
} from '/@/types/resource-informer.js';
import { RoutesResourceFactory } from '/@/resources/routes-resource-factory.js';
import { SecretsResourceFactory } from '/@/resources/secrets-resource-factory.js';
import { ServicesResourceFactory } from '/@/resources/services-resource-factory.js';
import { injectable } from 'inversify';
import { NamespacesResourceFactory } from '/@/resources/namespaces-resource-factory.js';
import { EndpointSlicesResourceFactory } from '/@/resources/endpoint-slices-resource-factory.js';
import { parseAllDocuments, stringify, type Tags } from 'yaml';
import { writeFile } from 'node:fs/promises';
import { ContextPermission } from '@podman-desktop/kubernetes-dashboard-extension-api';

const HEALTH_CHECK_TIMEOUT_MS = 5_000;
const DEFAULT_NAMESPACE = 'default';
const FIELD_MANAGER = 'kubernetes-dashboard';

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

  #onContextAdd = new Emitter<DispatcherEvent>();
  onContextAdd: Event<DispatcherEvent> = this.#onContextAdd.event;

  #onResourceUpdated = new Emitter<{ contextName: string; resourceName: string }>();
  onResourceUpdated: Event<{ contextName: string; resourceName: string }> = this.#onResourceUpdated.event;

  #onResourceCountUpdated = new Emitter<{ contextName: string; resourceName: string }>();
  onResourceCountUpdated: Event<{ contextName: string; resourceName: string }> = this.#onResourceCountUpdated.event;

  #onCurrentContextChange = new Emitter<void>();
  onCurrentContextChange: Event<void> = this.#onCurrentContextChange.event;

  #onObjectDeleted = new Emitter<{ contextName: string; resourceName: string; name: string; namespace: string }>();
  onObjectDeleted: Event<{ contextName: string; resourceName: string; name: string; namespace: string }> =
    this.#onObjectDeleted.event;

  #onEndpointsChange = new Emitter<void>();
  onEndpointsChange: Event<void> = this.#onEndpointsChange.event;

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
    this.#dispatcher.onAdd((state: DispatcherEvent) => this.#onContextAdd.fire(state));
    this.#dispatcher.onCurrentChange(this.onCurrentChange.bind(this));
  }

  get currentContext(): KubeConfigSingleContext | undefined {
    return this.#currentContext;
  }

  protected getResourceFactories(): ResourceFactory[] {
    return [
      new ConfigmapsResourceFactory(),
      new CronjobsResourceFactory(),
      new JobsResourceFactory(this),
      new DeploymentsResourceFactory(),
      new EndpointSlicesResourceFactory(this),
      new EventsResourceFactory(),
      new IngressesResourceFactory(this),
      new NamespacesResourceFactory(),
      new NodesResourceFactory(),
      new PodsResourceFactory(this),
      new PVCsResourceFactory(),
      new RoutesResourceFactory(this),
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

  // getResources returns the resources for the given contexts and resource name
  // if no context names are provided, the current context is used
  getResources(resourceName: string, contextName?: string): readonly KubernetesObject[] {
    let requestContextName = contextName;
    if (!requestContextName) {
      const currentContextName = this.currentContext?.getKubeConfig().currentContext;
      if (!currentContextName) {
        return [];
      }
      requestContextName = currentContextName;
    }

    const cache = this.#objectCaches.get(requestContextName, resourceName);
    return cache?.list() ?? [];
  }

  getResourceDetails(
    contextName: string,
    resourceName: string,
    name: string,
    namespace?: string,
  ): KubernetesObject | undefined {
    const value = this.#objectCaches.get(contextName, resourceName);
    return value?.get(name, namespace);
  }

  getResourceEvents(contextName: string, uid: string): CoreV1Event[] {
    return (
      this.#objectCaches
        .get(contextName, 'events')
        ?.list()
        .filter(o => this.isCoreV1Event(o))
        .filter(event => event.involvedObject.uid === uid) ?? []
    );
  }

  isCoreV1Event(resource: KubernetesObject): resource is CoreV1Event {
    return 'involvedObject' in resource;
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
              if (['endpointslices', 'routes', 'ingresses', 'pods'].includes(e.resourceName)) {
                this.#onEndpointsChange.fire();
              }
            });
            informer.onOffline((e: OfflineEvent) => {
              this.#onOfflineChange.fire();
              this.#objectCaches.removeForContext(e.kubeconfig.getKubeConfig().currentContext);
            });
            informer.onObjectDeleted((e: ObjectDeletedEvent) => {
              this.#onObjectDeleted.fire({
                contextName: e.kubeconfig.getKubeConfig().currentContext,
                resourceName: e.resourceName,
                name: e.name,
                namespace: e.namespace,
              });
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
      this.handleResult(result, `deletion of ${kind} ${name}`);
    } catch (error: unknown) {
      this.handleApiException(error, `deletion of ${kind} ${name}`);
    }
  }

  async searchBySelector(kind: string, options: SelectorOptions, namespace?: string): Promise<KubernetesObject[]> {
    if (!this.currentContext) {
      console.warn('search by selector: no current context');
      return [];
    }

    const handler = this.#resourceFactoryHandler.getResourceFactoryByKind(kind);
    if (!handler?.searchBySelector) {
      console.error(`search by selector: no handler for kind ${kind}`);
      return [];
    }
    const ns = namespace ?? this.currentContext.getNamespace();
    return handler.searchBySelector(this.currentContext, options, ns);
  }

  async restartObject(kind: string, name: string, namespace: string): Promise<void> {
    if (!this.currentContext) {
      console.warn('restart object: no current context');
      return;
    }

    const handler = this.#resourceFactoryHandler.getResourceFactoryByKind(kind);
    if (!handler?.restartObject) {
      console.error(`restart object: no handler for kind ${kind}`);
      return;
    }
    const ns = namespace ?? this.currentContext.getNamespace();
    return handler.restartObject(this.currentContext, name, ns);
  }

  private handleResult(result: KubernetesObject | V1Status, actionMsg: string): void {
    if (this.isV1Status(result)) {
      this.handleStatus(result, actionMsg);
    }
    // Ignore if result is a KubernetesObject
  }

  private handleApiException(error: unknown, actionMsg: string): void {
    if (error instanceof ApiException) {
      const statusError = error as ApiException<string>;
      let status: unknown;
      try {
        status = JSON.parse(statusError.body);
      } catch {
        throw error;
      }
      if (this.isV1Status(status)) {
        this.handleStatus(status, actionMsg);
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

  protected handleStatus(status: V1Status, actionMsg: string): void {
    window.showNotification({
      title: actionMsg,
      body: status.message,
      type: 'error',
      highlight: true,
    });
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

  async waitForObjectDeletion(
    resourceName: string,
    name: string,
    namespace: string,
    timeout: number = 60000,
  ): Promise<boolean> {
    if (!this.currentContext) {
      console.warn('wait deletion: no current context');
      return false;
    }

    let disposable: IDisposable | undefined = undefined;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    const dispose = (): void => {
      disposable?.dispose();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handler = this.#resourceFactoryHandler.getResourceFactoryByResourceName(resourceName);
    if (!handler?.readObject) {
      console.error(`wait deletion: no handler for resource ${resourceName}`);
      return false;
    }
    const reader = handler.readObject;

    return new Promise((resolve, reject) => {
      if (!this.currentContext) {
        console.warn('wait deletion: no current context');
        dispose();
        resolve(false);
        return;
      }

      // return false after Timeout
      timeoutId = setTimeout(() => {
        dispose();
        resolve(false);
      }, timeout);
      // return true when the object is deleted
      disposable = this.onObjectDeleted(event => {
        if (event.resourceName === resourceName && event.name === name && event.namespace === namespace) {
          dispose();
          resolve(true);
        }
      });
      // return true if the object already does not exist
      reader(this.currentContext, name, namespace).catch((e: unknown) => {
        const error = e ?? {};
        if (error instanceof ApiException && error.code === 404) {
          dispose();
          resolve(true);
          return;
        }
        dispose();
        reject(e);
      });
    });
  }

  searchByTargetRef(kind: string, targetRef: TargetRef): KubernetesObject[] {
    if (!this.currentContext) {
      console.warn('search by target ref: no current context');
      return [];
    }

    const handler = this.#resourceFactoryHandler.getResourceFactoryByKind(kind);
    if (!handler?.searchByTargetRef) {
      console.error(`search by target ref: no handler for kind ${kind}`);
      return [];
    }

    return handler.searchByTargetRef(this.currentContext, targetRef);
  }

  getEndpoints(contextName: string, targetKind: 'Pod', targetName: string, targetNamespace: string): Endpoint[] {
    const results: Endpoint[] = [];
    const endpoints = this.searchByTargetRef('EndpointSlice', {
      kind: targetKind,
      name: targetName,
      namespace: targetNamespace,
    });
    const services = endpoints
      .map(endpoint => endpoint.metadata?.ownerReferences?.find(owner => owner.controller && owner.kind === 'Service'))
      .filter(service => service !== undefined);
    for (const service of services) {
      const routes = this.searchByTargetRef('Route', {
        kind: 'Service',
        name: service.name,
        namespace: targetNamespace,
      });
      results.push(
        ...routes.map((route: V1Route) => ({
          contextName,
          targetKind,
          targetName,
          targetNamespace,
          inputKind: 'Route' as const,
          inputName: route.metadata?.name ?? '',
          url: route.spec?.tls ? `https://${route.spec?.host}` : `http://${route.spec?.host}`,
        })),
      );
      const ingresses = this.searchByTargetRef('Ingress', {
        kind: 'Service',
        name: service.name,
        namespace: targetNamespace,
      });
      results.push(
        ...ingresses
          .map((ingress: V1Ingress) => ({
            contextName,
            targetKind,
            targetName,
            targetNamespace,
            inputKind: 'Ingress' as const,
            inputName: ingress.metadata?.name ?? '',
            url: this.findIngressUrlForService(ingress, service.name),
          }))
          .filter(result => result.url !== ''),
      );
    }
    return results;
  }

  // find the url for a service in an ingress
  // should be computed in ingress resource factory instead?
  findIngressUrlForService(ingress: V1Ingress, serviceName: string): string {
    const rule = ingress.spec?.rules?.find(rule =>
      rule.http?.paths?.some(path => path.backend?.service?.name === serviceName),
    );
    if (rule) {
      const host = rule.host ?? '';
      const path = rule.http?.paths?.find(path => path.backend?.service?.name === serviceName)?.path ?? '';
      const protocol = ingress.spec?.tls ? 'https' : 'http';
      return `${protocol}://${host}${path}`;
    }
    // default backend: not exposed
    // TODO what do we want to return in this case?
    return '';
  }

  async applyResources(yamlDocuments: string): Promise<void> {
    const client = this.currentContext?.getKubeConfig().makeApiClient(KubernetesObjectApi);
    if (!client) {
      throw new Error('apply resources: unable to get client for current context');
    }
    const manifests = loadAllYaml(this.convertYamlFrom11to12(yamlDocuments)).filter(manifest => !!manifest);
    for (const manifest of manifests) {
      manifest.metadata ??= {};
      manifest.metadata.annotations ??= {};
      manifest.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(manifest);
      manifest.metadata.namespace ??= this.currentContext?.getNamespace() ?? DEFAULT_NAMESPACE;
      try {
        const result = await client.patch(
          manifest,
          undefined, // pretty
          undefined, // dryRun
          FIELD_MANAGER,
          undefined, // force
          PatchStrategy.StrategicMergePatch,
        );
        this.handleResult(result, `patch of ${manifest.kind} ${manifest.metadata?.name}`);
      } catch (error: unknown) {
        this.handleApiException(error, `patch of ${manifest.kind} ${manifest.metadata?.name}`);
      }
    }
  }

  convertYamlFrom11to12(yamlDocuments: string): string {
    const parsedManifests = parseAllDocuments(yamlDocuments, { customTags: this.getTags });
    return parsedManifests.map(parsedManifest => stringify(parsedManifest)).join('\n');
  }

  getTags(tags: Tags): Tags {
    for (const tag of tags) {
      if (typeof tag === 'object' && 'tag' in tag) {
        if (tag.tag === 'tag:yaml.org,2002:int') {
          const newTag = { ...tag };
          newTag.test = /^(0[0-7][0-7][0-7])$/;
          newTag.resolve = (str: string): number => parseInt(str, 8);
          tags.unshift(newTag);
          break;
        }
      }
    }
    return tags;
  }

  getContextsNames(): string[] {
    return this.#currentKubeConfig.contexts.map(ctx => ctx.name);
  }

  async setCurrentContext(contextName: string): Promise<void> {
    this.#currentKubeConfig.currentContext = contextName;
    const jsonString = this.#currentKubeConfig.exportConfig();
    const yamlString = jsYaml.dump(JSON.parse(jsonString));
    const kubeconfigUri = kubernetes.getKubeconfig();
    await writeFile(kubeconfigUri.path, yamlString);
  }
}
