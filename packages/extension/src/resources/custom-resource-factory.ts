/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import type { KubernetesListObject, KubernetesObject } from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';
import type { ApiGroupList, ApiResourceList } from '@podman-desktop/kubernetes-dashboard-extension-api';

import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export interface CustomResourceName {
  plural: string;
  group: string;
}

// parseCustomResourceName parses a resource name of the form `<plural>.<group>`
// (e.g. `catalogsources.operators.coreos.com`), as used by kubectl for custom resources
export function parseCustomResourceName(resourceName: string): CustomResourceName | undefined {
  const index = resourceName.indexOf('.');
  if (index <= 0 || index === resourceName.length - 1) {
    return undefined;
  }
  return {
    plural: resourceName.slice(0, index),
    group: resourceName.slice(index + 1),
  };
}

// ApiDiscovery gives access to the API groups and resources served by a cluster
export interface ApiDiscovery {
  getApiVersions(): Promise<ApiGroupList>;
  getApiResources(groupVersion: string): Promise<ApiResourceList>;
}

export interface CustomResourceFactoryOptions {
  // the name of the resource, as `<plural>.<group>`
  resource: string;
  kind: string;
  group: string;
  version: string;
  plural: string;
  namespaced: boolean;
}

/**
 * CustomResourceFactory is a factory for any resource served by an API group other than the core one,
 * typically provided by a CustomResourceDefinition.
 *
 * Its informer watches the objects of the namespace of the kubeconfig for a namespaced resource,
 * and the objects of the cluster for a cluster-scoped resource.
 *
 * Use `CustomResourceFactory.resolve` to build the factory from the information discovered on a cluster.
 */
export class CustomResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  #group: string;
  #version: string;
  #plural: string;
  #namespaced: boolean;

  constructor(options: CustomResourceFactoryOptions) {
    super({
      resource: options.resource,
      kind: options.kind,
    });
    this.#group = options.group;
    this.#version = options.version;
    this.#plural = options.plural;
    this.#namespaced = options.namespaced;

    this.setIsCustomResource();
    this.setPermissions({
      isNamespaced: options.namespaced,
      permissionsRequests: [
        {
          verb: 'watch',
          group: options.group,
          resource: options.plural,
        },
      ],
    });
    this.setInformer({
      createInformer: this.createInformer.bind(this),
    });
  }

  // resolve discovers, on the cluster, the version of the group of `resourceName` (`<plural>.<group>`) serving the resource,
  // and the description of the resource for this version.
  // As the resources of a group can be served by different versions, the versions are tried
  // in order of preference (the preferred version first, then the versions as ordered by the API server),
  // and the first version serving the resource is used.
  // It returns undefined if the resource is not served by the cluster, or cannot be listed and watched.
  static async resolve(discovery: ApiDiscovery, resourceName: string): Promise<CustomResourceFactory | undefined> {
    const name = parseCustomResourceName(resourceName);
    if (!name) {
      return undefined;
    }
    const groups = await discovery.getApiVersions();
    const group = groups.groups.find(g => g.name === name.group);
    if (!group) {
      return undefined;
    }
    const versions = [
      ...new Set([
        ...(group.preferredVersion ? [group.preferredVersion.version] : []),
        ...group.versions.map(v => v.version),
      ]),
    ];
    for (const version of versions) {
      const resources = await discovery.getApiResources(`${name.group}/${version}`);
      const resource = resources.resources.find(r => r.name === name.plural);
      if (!resource) {
        continue;
      }
      if (!['list', 'watch'].every(verb => resource.verbs.includes(verb))) {
        return undefined;
      }
      return new CustomResourceFactory({
        resource: resourceName,
        kind: resource.kind,
        group: name.group,
        version,
        plural: name.plural,
        namespaced: resource.namespaced,
      });
    }
    return undefined;
  }

  get group(): string {
    return this.#group;
  }

  get version(): string {
    return this.#version;
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CustomObjectsApi);
    const group = this.#group;
    const version = this.#version;
    const plural = this.#plural;
    let path: string;
    let listFn: () => Promise<KubernetesListObject<KubernetesObject>>;
    if (this.#namespaced) {
      const namespace = kubeconfig.getNamespace();
      path = `/apis/${group}/${version}/namespaces/${namespace}/${plural}`;
      listFn = (): Promise<KubernetesListObject<KubernetesObject>> =>
        apiClient.listNamespacedCustomObject({ group, version, namespace, plural }) as Promise<
          KubernetesListObject<KubernetesObject>
        >;
    } else {
      path = `/apis/${group}/${version}/${plural}`;
      listFn = (): Promise<KubernetesListObject<KubernetesObject>> =>
        apiClient.listClusterCustomObject({ group, version, plural }) as Promise<
          KubernetesListObject<KubernetesObject>
        >;
    }
    return new ResourceInformer<KubernetesObject>({
      kubeconfig,
      path,
      listFn,
      kind: this.kind,
      // the informer reports its events with the name of the resource, as `<plural>.<group>`
      plural: this.resource,
    });
  }
}
