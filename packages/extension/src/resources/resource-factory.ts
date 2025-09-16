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
import type { KubernetesObject, V1ResourceAttributes, V1Status } from '@kubernetes/client-node';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceInformer } from '/@/types/resource-informer.js';
import type { TargetRef } from '/@common/model/target-ref';

export interface ResourcePermissionsFactory {
  get permissionsRequests(): V1ResourceAttributes[];
  get isNamespaced(): boolean;
}

export interface ResourceInformerFactory {
  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<KubernetesObject>;
}

type DeleteNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  name: string,
  namespace: string,
) => Promise<V1Status | KubernetesObject>;

type DeleteNonNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  name: string,
) => Promise<V1Status | KubernetesObject>;

export type SelectorOptions = {
  labelSelector?: string;
  fieldSelector?: string;
};
type SearchBySelectorNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  options: SelectorOptions,
  namespace: string,
) => Promise<KubernetesObject[]>;

type SearchBySelectorNonNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  options: SelectorOptions,
) => Promise<KubernetesObject[]>;

type ReadNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  name: string,
  namespace: string,
) => Promise<KubernetesObject>;

type ReadNonNamespacedObject = (kubeconfig: KubeConfigSingleContext, name: string) => Promise<KubernetesObject>;

type RestartNamespacedObject = (kubeconfig: KubeConfigSingleContext, name: string, namespace: string) => Promise<void>;

type RestartNonNamespacedObject = (kubeconfig: KubeConfigSingleContext, name: string) => Promise<void>;

type SearchByTargetRefNamespacedObject = (
  kubeconfig: KubeConfigSingleContext,
  targetRef: TargetRef,
) => KubernetesObject[];

export class ResourceFactoryBase {
  #resource: string;
  #kind: string;
  #permissions: ResourcePermissionsFactory | undefined;
  #informer: ResourceInformerFactory | undefined;
  #isActive: undefined | ((resource: KubernetesObject) => boolean);
  #deleteObject: DeleteNamespacedObject | DeleteNonNamespacedObject;
  #searchBySelector: SearchBySelectorNamespacedObject | SearchBySelectorNonNamespacedObject;
  #searchByTargetRef: SearchByTargetRefNamespacedObject;
  #readObject: ReadNamespacedObject | ReadNonNamespacedObject;
  #restartObject: RestartNamespacedObject | RestartNonNamespacedObject;

  constructor(options: { resource: string; kind: string }) {
    this.#resource = options.resource;
    this.#kind = options.kind;
  }

  setPermissions(options: { permissionsRequests: V1ResourceAttributes[]; isNamespaced: boolean }): ResourceFactoryBase {
    this.#permissions = {
      permissionsRequests: options.permissionsRequests,
      isNamespaced: options.isNamespaced,
    };
    return this;
  }

  setInformer(options: {
    createInformer: (kubeconfig: KubeConfigSingleContext) => ResourceInformer<KubernetesObject>;
  }): ResourceFactoryBase {
    this.#informer = {
      createInformer: options.createInformer,
    };
    return this;
  }

  setIsActive(isActive: (resource: KubernetesObject) => boolean): ResourceFactoryBase {
    this.#isActive = isActive;
    return this;
  }

  setDeleteObject(deleteObject: DeleteNamespacedObject | DeleteNonNamespacedObject): ResourceFactoryBase {
    this.#deleteObject = deleteObject;
    return this;
  }

  setSearchBySelector(
    searchBySelector: SearchBySelectorNamespacedObject | SearchBySelectorNonNamespacedObject,
  ): ResourceFactoryBase {
    this.#searchBySelector = searchBySelector;
    return this;
  }

  setSearchByTargetRef(searchByTargetRef: SearchByTargetRefNamespacedObject): ResourceFactoryBase {
    this.#searchByTargetRef = searchByTargetRef;
    return this;
  }

  setReadObject(readObject: ReadNamespacedObject | ReadNonNamespacedObject): ResourceFactoryBase {
    this.#readObject = readObject;
    return this;
  }

  setRestartObject(restartObject: RestartNamespacedObject | RestartNonNamespacedObject): ResourceFactoryBase {
    this.#restartObject = restartObject;
    return this;
  }

  get resource(): string {
    return this.#resource;
  }

  get kind(): string {
    return this.#kind;
  }

  get permissions(): ResourcePermissionsFactory | undefined {
    return this.#permissions;
  }

  get informer(): ResourceInformerFactory | undefined {
    return this.#informer;
  }

  get isActive(): undefined | ((resource: KubernetesObject) => boolean) {
    return this.#isActive;
  }

  get deleteObject(): DeleteNamespacedObject | DeleteNonNamespacedObject {
    return this.#deleteObject;
  }

  get searchBySelector(): SearchBySelectorNamespacedObject | SearchBySelectorNonNamespacedObject {
    return this.#searchBySelector;
  }

  get searchByTargetRef(): SearchByTargetRefNamespacedObject {
    return this.#searchByTargetRef;
  }

  get readObject(): ReadNamespacedObject | ReadNonNamespacedObject {
    return this.#readObject;
  }

  get restartObject(): RestartNamespacedObject | RestartNonNamespacedObject {
    return this.#restartObject;
  }

  copyWithSlicedPermissions(): ResourceFactory {
    if (!this.#permissions) {
      throw new Error('permission must be defined before calling copyWithSlicedPermissions');
    }
    return new ResourceFactoryBase({
      resource: this.#resource,
      kind: this.#kind,
    })
      .setPermissions({
        permissionsRequests: this.#permissions.permissionsRequests.slice(1),
        isNamespaced: this.#permissions.isNamespaced,
      })
      .setSearchBySelector(this.#searchBySelector)
      .setRestartObject(this.#restartObject)
      .setSearchByTargetRef(this.#searchByTargetRef);
  }
}

export interface ResourceFactory {
  get resource(): string;
  get kind(): string;
  permissions?: ResourcePermissionsFactory;
  informer?: ResourceInformerFactory;
  // isActive returns true if `resource` is considered active
  isActive?: (resource: KubernetesObject) => boolean;
  copyWithSlicedPermissions(): ResourceFactory;
  deleteObject?: DeleteNamespacedObject | DeleteNonNamespacedObject;
  searchBySelector?: SearchBySelectorNamespacedObject | SearchBySelectorNonNamespacedObject;
  searchByTargetRef?: SearchByTargetRefNamespacedObject;
  scaleObject?: (kubeconfig: KubeConfigSingleContext, name: string, namespace: string) => Promise<void>;
  readObject?: ReadNamespacedObject | ReadNonNamespacedObject;
  restartObject?: RestartNamespacedObject | RestartNonNamespacedObject;
}

export function isResourceFactoryWithPermissions(object: ResourceFactory): object is ResourceFactoryWithPermissions {
  return !!object.permissions;
}

interface ResourceFactoryWithPermissions extends ResourceFactory {
  permissions: ResourcePermissionsFactory;
}
