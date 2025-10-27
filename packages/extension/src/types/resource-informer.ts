/**********************************************************************
 * Copyright (C) 2024, 2025 Red Hat, Inc.
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

import type {
  Informer,
  KubeConfig,
  KubernetesListObject,
  KubernetesObject,
  ListPromise,
  ObjectCache,
} from '@kubernetes/client-node';
import { ADD, ApiException, DELETE, ERROR, makeInformer, UPDATE } from '@kubernetes/client-node';
import type { Disposable } from '@podman-desktop/api';

import type { Event } from './emitter.js';
import { Emitter } from './emitter.js';
import type { KubeConfigSingleContext } from './kubeconfig-single-context.js';

interface BaseEvent {
  kubeconfig: KubeConfigSingleContext;
  resourceName: string;
}

export interface CacheUpdatedEvent extends BaseEvent {
  countChanged: boolean;
}

export interface ObjectDeletedEvent extends BaseEvent {
  name: string;
  namespace: string;
}

export interface OfflineEvent extends BaseEvent {
  offline: boolean;
  reason?: string;
}

export interface ResourceInformerOptions<T extends KubernetesObject> {
  kubeconfig: KubeConfigSingleContext;
  // the endpoint in the Kubernetes api server to list the resources
  path: string;
  // the function to list the resources
  listFn: ListPromise<T>;
  // the kind of the resource (Pod, ...), appearing in the `kind` field of manifests for this resource
  kind: string;
  // the name of the resource for the 'REST API' (pods, ...), appearing in the path above
  plural: string;
}

class StepByStepCache<T extends KubernetesObject> implements ObjectCache<T> {
  #cache: Map<string, T> = new Map();
  #namespace: string | undefined;

  constructor(objects: readonly T[], namespace?: string) {
    this.#namespace = namespace;
    this.#cache = new Map(objects.map(object => [object.metadata?.name ?? '', object]));
  }

  get(name: string, namespace?: string): T | undefined {
    if (!namespace || namespace === this.#namespace) {
      return this.#cache.get(name);
    }
    return undefined;
  }
  list(): T[] {
    return Array.from(this.#cache.values());
  }
}

export class ResourceInformer<T extends KubernetesObject> implements Disposable {
  #kubeConfig: KubeConfigSingleContext;
  #path: string;
  #listFn: ListPromise<T>;
  #pluralName: string;
  #kindName: string;
  #informer: Informer<T> | undefined;
  #realtimeCache: ObjectCache<T>;
  #offline: boolean = false;
  #stepByStepMode: boolean;
  #stepByStepCache: StepByStepCache<T> | undefined;

  #onCacheUpdated = new Emitter<CacheUpdatedEvent>();
  onCacheUpdated: Event<CacheUpdatedEvent> = this.#onCacheUpdated.event;

  #onOffline = new Emitter<OfflineEvent>();
  onOffline: Event<OfflineEvent> = this.#onOffline.event;

  #onObjectDeleted = new Emitter<ObjectDeletedEvent>();
  onObjectDeleted: Event<ObjectDeletedEvent> = this.#onObjectDeleted.event;

  constructor(options: ResourceInformerOptions<T>) {
    this.#kubeConfig = options.kubeconfig;
    this.#path = options.path;
    this.#listFn = options.listFn;
    this.#pluralName = options.plural;
    this.#kindName = options.kind;
    this.#stepByStepMode = false;
  }

  // start the informer and returns a cache to the data
  // The cache will be active all the time, even if an error happens
  // and the informer becomes offline
  start(): void {
    // internalInformer extends both Informer and ObjectCache
    const typedList = async (): Promise<KubernetesListObject<T>> => {
      const list = await this.#listFn();
      return {
        ...list,
        items: list.items.map(item => ({
          kind: this.#kindName,
          apiVersion: list.apiVersion,
          ...item,
        })),
      };
    };
    const internalInformer = this.makeInformer(this.#kubeConfig.getKubeConfig(), this.#path, typedList);
    this.#informer = internalInformer;
    this.#realtimeCache = internalInformer;

    this.#informer.on(UPDATE, (_obj: T) => {
      if (this.#stepByStepMode) {
        console.log(`==> UPDATE ${this.#pluralName} ${_obj.metadata?.name}`);
        // TODO update local cache
        return;
      }
      this.#onCacheUpdated.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        countChanged: false,
      });
    });
    this.#informer.on(ADD, (_obj: T) => {
      if (this.#stepByStepMode) {
        console.log(`==> ADD ${this.#pluralName} ${_obj.metadata?.name}`);
        // TODO update local cache
        return;
      }
      this.#onCacheUpdated.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        countChanged: true,
      });
    });
    this.#informer.on(DELETE, (obj: T) => {
      if (this.#stepByStepMode) {
        console.log(`==> DELETE ${this.#pluralName} ${obj.metadata?.name}`);
        // TODO update local cache
        return;
      }
      this.#onCacheUpdated.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        countChanged: true,
      });
      this.#onObjectDeleted.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        name: obj.metadata?.name ?? '',
        namespace: obj.metadata?.namespace ?? '',
      });
    });
    // This is issued when there is an error
    this.#informer.on(ERROR, (error: unknown) => {
      if (error instanceof ApiException && error.code === 404) {
        // starting from kubernetes-client v1.1, informer is correctly started even if resource does not exist in API
        // and the 404 error is received here
        return;
      }
      this.#offline = true;
      this.#onOffline.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        offline: true,
        reason: String(error),
      });
    });
    this.#informer.start().catch((err: unknown) => {
      console.error(
        `error starting the informer for resource ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext}: ${String(err)}`,
      );
    });
  }

  // reconnect tries to start the informer again if it is marked as offline
  // (after an error happens)
  reconnect(): void {
    if (!!this.#informer && this.#offline) {
      this.#offline = false;
      this.#onOffline.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        offline: false,
      });
      this.#informer.start().catch((err: unknown) => {
        console.error(
          `error starting the informer for resource ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext}: ${String(err)}`,
        );
      });
    }
  }

  dispose(): void {
    this.#onCacheUpdated.dispose();
    this.#onOffline.dispose();
    this.#informer?.stop().catch((err: unknown) => {
      console.error(
        `error stopping the informer for resource ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext}: ${String(err)}`,
      );
    });
  }

  isOffline(): boolean {
    return this.#offline;
  }

  makeInformer(kubeConfig: KubeConfig, path: string, listFn: ListPromise<T>): Informer<T> & ObjectCache<T> {
    return makeInformer(kubeConfig, path, listFn);
  }

  getCache(): ObjectCache<T> {
    if (this.#stepByStepMode) {
      if (!this.#stepByStepCache) {
        throw new Error('Step by step cache is not initialized');
      }
      return this.#stepByStepCache;
    }
    return this.#realtimeCache;
  }

  setStepByStepMode(stepByStep: boolean): void {
    this.#stepByStepMode = stepByStep;
    if (stepByStep) {
      this.#stepByStepCache = new StepByStepCache<T>(this.#realtimeCache.list(), this.#kubeConfig.getNamespace());
    } else {
      this.#stepByStepCache = undefined;
    }
    this.#onCacheUpdated.fire({
      kubeconfig: this.#kubeConfig,
      resourceName: this.#pluralName,
      countChanged: false,
    });
  }
}
