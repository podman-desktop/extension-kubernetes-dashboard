/**********************************************************************
 * Copyright (C) 2024 - 2026 Red Hat, Inc.
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

import { randomInt } from 'node:crypto';

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

// how many consecutive 429 responses we retry before declaring the informer offline
const MAX_RETRIES_ON_THROTTLING = 5;
// delay of the first retry after a 429, when the server does not tell us how long to wait
const BASE_RETRY_DELAY_MS = 1_000;
// upper bound of the retry delay, including the delay asked by the server
const MAX_RETRY_DELAY_MS = 60_000;
// after this delay without any 429, the next one is considered a new incident
// and the backoff starts again from the beginning
const RETRY_COUNT_RESET_MS = 5 * 60_000;

export class ResourceInformer<T extends KubernetesObject> implements Disposable {
  #kubeConfig: KubeConfigSingleContext;
  #path: string;
  #listFn: ListPromise<T>;
  #pluralName: string;
  #kindName: string;
  #informer: Informer<T> | undefined;
  #offline: boolean = false;
  // timer of a pending retry after the server asked us to slow down (HTTP 429)
  #retryTimer: NodeJS.Timeout | undefined;
  // number of retries after a 429 during the current incident
  #retryCount: number = 0;
  // date of the last retry after a 429, used to detect the end of an incident
  #lastRetryTime: number = 0;
  #disposed: boolean = false;

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
  }

  // start the informer and returns a cache to the data
  // The cache will be active all the time, even if an error happens
  // and the informer becomes offline
  start(): ObjectCache<T> {
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

    this.#informer.on(UPDATE, (_obj: T) => {
      this.#onCacheUpdated.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        countChanged: false,
      });
    });
    this.#informer.on(ADD, (_obj: T) => {
      this.#onCacheUpdated.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        countChanged: true,
      });
    });
    this.#informer.on(DELETE, (obj: T) => {
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
      // an error can still be received after the informer has been stopped,
      // for instance the error caused by the abortion of the watch request
      if (this.#disposed) {
        return;
      }
      const statusCode = getStatusCode(error);
      if (statusCode === 404) {
        // starting from kubernetes-client v1.1, informer is correctly started even if resource does not exist in API
        // and the 404 error is received here
        return;
      }
      // the server asks us to slow down: retry instead of declaring the informer offline,
      // as going offline drops the caches of every resource of the context
      if (statusCode === 429) {
        if (this.#getRetryCount() < MAX_RETRIES_ON_THROTTLING) {
          this.#scheduleRetry(error);
          return;
        }
        console.error(
          `[informer] ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext} is still receiving 429 (Too Many Requests) after ${MAX_RETRIES_ON_THROTTLING} retries, going offline`,
        );
      }
      this.#offline = true;
      this.#onOffline.fire({
        kubeconfig: this.#kubeConfig,
        resourceName: this.#pluralName,
        offline: true,
        reason: String(error),
      });
    });
    this.#cancelRetry();
    this.#retryCount = 0;
    this.#startInformer();
    return internalInformer;
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
      this.#cancelRetry();
      this.#retryCount = 0;
      this.#startInformer();
    }
  }

  dispose(): void {
    this.#disposed = true;
    this.#cancelRetry();
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

  #startInformer(): void {
    this.#informer?.start().catch((err: unknown) => {
      console.error(
        `error starting the informer for resource ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext}: ${String(err)}`,
      );
    });
  }

  // the informer has no event telling us the watch is established (CONNECT is fired before
  // the list request), so instead of resetting the counter when connected, we consider that
  // a 429 received long enough after the previous one starts a new incident
  #getRetryCount(): number {
    return Date.now() - this.#lastRetryTime > RETRY_COUNT_RESET_MS ? 0 : this.#retryCount;
  }

  // schedules a restart of the informer after the server answered 429 (Too Many Requests)
  #scheduleRetry(error: unknown): void {
    this.#cancelRetry();
    this.#retryCount = this.#getRetryCount() + 1;
    this.#lastRetryTime = Date.now();
    const delay = getRetryDelayMs(error, this.#retryCount);
    console.warn(
      `[informer] ${this.#pluralName} on context ${this.#kubeConfig.getKubeConfig().currentContext} received 429 (Too Many Requests), retrying in ${Math.round(delay / 100) / 10}s (attempt ${this.#retryCount}/${MAX_RETRIES_ON_THROTTLING})`,
    );
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined;
      this.#startInformer();
    }, delay);
    // a pending retry must not keep the process alive
    this.#retryTimer.unref?.();
  }

  #cancelRetry(): void {
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = undefined;
    }
  }

  makeInformer(kubeConfig: KubeConfig, path: string, listFn: ListPromise<T>): Informer<T> & ObjectCache<T> {
    return makeInformer(kubeConfig, path, listFn);
  }
}

// the error received on the ERROR event is an ApiException when it comes from the list request,
// and a plain Error carrying a statusCode when it comes from the watch request
function getStatusCode(error: unknown): number | undefined {
  if (error instanceof ApiException) {
    return error.code;
  }
  const statusCode: unknown = (error as { statusCode?: unknown })?.statusCode;
  return typeof statusCode === 'number' ? statusCode : undefined;
}

// returns how long to wait before retrying, honouring the delay asked by the server
// (Retry-After header or Status.details.retryAfterSeconds), falling back to an exponential
// backoff, and adding a jitter so that all the informers of a context do not retry at the same time
function getRetryDelayMs(error: unknown, retryCount: number): number {
  const serverDelayMs = getServerRetryAfterMs(error);
  const backoffMs = BASE_RETRY_DELAY_MS * 2 ** (retryCount - 1);
  const delayMs = Math.min(Math.max(serverDelayMs ?? 0, backoffMs), MAX_RETRY_DELAY_MS);
  // up to 20% of jitter
  return delayMs + randomInt(Math.floor(delayMs / 5) + 1);
}

function getServerRetryAfterMs(error: unknown): number | undefined {
  if (!(error instanceof ApiException)) {
    return undefined;
  }
  const header = Object.entries(error.headers ?? {}).find(([name]) => name.toLowerCase() === 'retry-after')?.[1];
  const headerSeconds = header ? Number(header) : Number.NaN;
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return headerSeconds * 1_000;
  }
  const bodySeconds = getRetryAfterSecondsFromBody(error.body);
  return bodySeconds === undefined ? undefined : bodySeconds * 1_000;
}

function getRetryAfterSecondsFromBody(body: unknown): number | undefined {
  let status: unknown = body;
  if (typeof status === 'string') {
    try {
      status = JSON.parse(status);
    } catch {
      return undefined;
    }
  }
  const seconds: unknown = (status as { details?: { retryAfterSeconds?: unknown } })?.details?.retryAfterSeconds;
  return typeof seconds === 'number' && seconds > 0 ? seconds : undefined;
}
