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

import type {
  ADD,
  CHANGE,
  CONNECT,
  DELETE,
  ErrorCallback,
  ERROR,
  Informer,
  KubernetesObject,
  ListPromise,
  ObjectCache,
  ObjectCallback,
  UPDATE,
} from '@kubernetes/client-node';

type ObjectVerb = ADD | UPDATE | DELETE | CHANGE;
type ErrorVerb = ERROR | CONNECT;

/**
 * ListOnceInformer is an informer for resources which cannot be watched (`watch` is not in the verbs
 * returned by the API discovery for the resource, as for some resources served by aggregated APIs).
 *
 * The resources are listed when the informer is started, and never updated after:
 * the cache is a snapshot of the resources at start time.
 * The events are emitted as the informers of @kubernetes/client-node do for their initial list
 * (`add` for each new object, `update` for each existing one, `delete` for each removed one when started again),
 * and an error during the list is emitted as an `error` event.
 */
export class ListOnceInformer<T extends KubernetesObject> implements Informer<T>, ObjectCache<T> {
  #listFn: ListPromise<T>;
  #objects = new Map<string, T>();
  #objectCallbacks = new Map<string, ObjectCallback<T>[]>();
  #errorCallbacks = new Map<string, ErrorCallback[]>();
  #stopped = false;

  constructor(listFn: ListPromise<T>) {
    this.#listFn = listFn;
  }

  on(verb: ObjectVerb, cb: ObjectCallback<T>): void;
  on(verb: ErrorVerb, cb: ErrorCallback): void;
  on(verb: ObjectVerb | ErrorVerb, cb: ObjectCallback<T> | ErrorCallback): void {
    if (verb === 'error' || verb === 'connect') {
      this.#errorCallbacks.set(verb, [...(this.#errorCallbacks.get(verb) ?? []), cb as ErrorCallback]);
    } else {
      this.#objectCallbacks.set(verb, [...(this.#objectCallbacks.get(verb) ?? []), cb as ObjectCallback<T>]);
    }
  }

  off(verb: ObjectVerb, cb: ObjectCallback<T>): void;
  off(verb: ErrorVerb, cb: ErrorCallback): void;
  off(verb: ObjectVerb | ErrorVerb, cb: ObjectCallback<T> | ErrorCallback): void {
    if (verb === 'error' || verb === 'connect') {
      this.#errorCallbacks.set(
        verb,
        (this.#errorCallbacks.get(verb) ?? []).filter(callback => callback !== cb),
      );
    } else {
      this.#objectCallbacks.set(
        verb,
        (this.#objectCallbacks.get(verb) ?? []).filter(callback => callback !== cb),
      );
    }
  }

  async start(): Promise<void> {
    this.#stopped = false;
    let items: T[];
    try {
      items = (await this.#listFn()).items;
    } catch (err: unknown) {
      if (!this.#stopped) {
        this.#emitError(err);
      }
      return;
    }
    if (this.#stopped) {
      return;
    }
    const previous = this.#objects;
    this.#objects = new Map(items.map(item => [keyOf(item), item]));
    for (const [key, item] of this.#objects) {
      this.#emitObject(previous.has(key) ? 'update' : 'add', item);
    }
    for (const [key, item] of previous) {
      if (!this.#objects.has(key)) {
        this.#emitObject('delete', item);
      }
    }
  }

  async stop(): Promise<void> {
    this.#stopped = true;
  }

  get(name: string, namespace?: string): T | undefined {
    return this.#objects.get(keyOf({ metadata: { name, namespace } }));
  }

  list(namespace?: string): ReadonlyArray<T> {
    const objects = Array.from(this.#objects.values());
    return namespace ? objects.filter(object => object.metadata?.namespace === namespace) : objects;
  }

  #emitObject(verb: ObjectVerb, object: T): void {
    for (const callback of this.#objectCallbacks.get(verb) ?? []) {
      callback(object);
    }
  }

  #emitError(err: unknown): void {
    for (const callback of this.#errorCallbacks.get('error') ?? []) {
      callback(err);
    }
  }
}

function keyOf(object: KubernetesObject): string {
  return `${object.metadata?.namespace ?? ''}/${object.metadata?.name ?? ''}`;
}
