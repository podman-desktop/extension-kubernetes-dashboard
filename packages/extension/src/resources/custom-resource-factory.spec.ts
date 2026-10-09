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

import type { CustomObjectsApi, KubernetesObject } from '@kubernetes/client-node';
import { KubeConfig } from '@kubernetes/client-node';
import type { ApiGroupList, ApiResourceList } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ApiDiscovery } from './custom-resource-factory.js';
import { CustomResourceFactory, parseCustomResourceName } from './custom-resource-factory.js';
import { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

vi.mock(import('/@/types/resource-informer.js'));

const OPERATORS_GROUP: ApiGroupList = {
  groups: [
    {
      name: 'operators.coreos.com',
      // as served by OLM: the preferred version does not serve all the resources of the group
      versions: [
        { groupVersion: 'operators.coreos.com/v2', version: 'v2' },
        { groupVersion: 'operators.coreos.com/v1', version: 'v1' },
        { groupVersion: 'operators.coreos.com/v1alpha2', version: 'v1alpha2' },
        { groupVersion: 'operators.coreos.com/v1alpha1', version: 'v1alpha1' },
      ],
      preferredVersion: { groupVersion: 'operators.coreos.com/v2', version: 'v2' },
    },
  ],
};

const OPERATORS_V2_RESOURCES: ApiResourceList = {
  groupVersion: 'operators.coreos.com/v2',
  resources: [
    {
      name: 'operatorconditions',
      singularName: 'operatorcondition',
      namespaced: true,
      kind: 'OperatorCondition',
      verbs: ['get', 'list', 'watch'],
    },
  ],
};

const OPERATORS_V1_RESOURCES: ApiResourceList = {
  groupVersion: 'operators.coreos.com/v1',
  resources: [
    {
      name: 'operatorconditions',
      singularName: 'operatorcondition',
      namespaced: true,
      kind: 'OperatorCondition',
      verbs: ['get', 'list', 'watch'],
    },
    {
      name: 'operatorgroups',
      singularName: 'operatorgroup',
      namespaced: true,
      kind: 'OperatorGroup',
      verbs: ['get', 'list', 'watch'],
    },
  ],
};

const OPERATORS_V1ALPHA2_RESOURCES: ApiResourceList = {
  groupVersion: 'operators.coreos.com/v1alpha2',
  resources: [],
};

const OPERATORS_V1ALPHA1_RESOURCES: ApiResourceList = {
  groupVersion: 'operators.coreos.com/v1alpha1',
  resources: [
    {
      name: 'catalogsources',
      singularName: 'catalogsource',
      namespaced: true,
      kind: 'CatalogSource',
      verbs: ['delete', 'get', 'list', 'patch', 'watch'],
    },
    {
      name: 'catalogsources/status',
      singularName: '',
      namespaced: true,
      kind: 'CatalogSource',
      verbs: ['get', 'patch', 'update'],
    },
    {
      name: 'nowatches',
      singularName: 'nowatch',
      namespaced: false,
      kind: 'NoWatch',
      verbs: ['get', 'list'],
    },
    {
      name: 'nolists',
      singularName: 'nolist',
      namespaced: false,
      kind: 'NoList',
      verbs: ['get'],
    },
  ],
};

let discovery: ApiDiscovery;

beforeEach(() => {
  vi.resetAllMocks();
  discovery = {
    getApiVersions: vi.fn().mockResolvedValue(OPERATORS_GROUP),
    getApiResources: vi.fn().mockImplementation(
      async (groupVersion: string) =>
        ({
          'operators.coreos.com/v2': OPERATORS_V2_RESOURCES,
          'operators.coreos.com/v1': OPERATORS_V1_RESOURCES,
          'operators.coreos.com/v1alpha2': OPERATORS_V1ALPHA2_RESOURCES,
          'operators.coreos.com/v1alpha1': OPERATORS_V1ALPHA1_RESOURCES,
        })[groupVersion],
    ),
  };
});

describe('parseCustomResourceName', () => {
  test.each([
    ['catalogsources.operators.coreos.com', { plural: 'catalogsources', group: 'operators.coreos.com' }],
    ['widgets.example', { plural: 'widgets', group: 'example' }],
    ['pods', undefined],
    ['.example.com', undefined],
    ['widgets.', undefined],
  ])('%s', (resourceName, expected) => {
    expect(parseCustomResourceName(resourceName)).toEqual(expected);
  });
});

describe('resolve', () => {
  test('builds a factory for the most preferred version serving the resource', async () => {
    const factory = await CustomResourceFactory.resolve(discovery, 'catalogsources.operators.coreos.com');
    expect(vi.mocked(discovery.getApiResources).mock.calls.map(call => call[0])).toEqual([
      'operators.coreos.com/v2',
      'operators.coreos.com/v1',
      'operators.coreos.com/v1alpha2',
      'operators.coreos.com/v1alpha1',
    ]);
    expect(factory?.resource).toEqual('catalogsources.operators.coreos.com');
    expect(factory?.kind).toEqual('CatalogSource');
    expect(factory?.group).toEqual('operators.coreos.com');
    expect(factory?.version).toEqual('v1alpha1');
    expect(factory?.isCustomResource).toBeTruthy();
    expect(factory?.watchable).toBeTruthy();
    expect(factory?.permissions).toEqual({
      isNamespaced: true,
      permissionsRequests: [{ verb: 'watch', group: 'operators.coreos.com', resource: 'catalogsources' }],
    });
    expect(factory?.informer).toBeDefined();
  });

  test('returns undefined for a name which is not a custom resource name', async () => {
    await expect(CustomResourceFactory.resolve(discovery, 'pods')).resolves.toBeUndefined();
    expect(discovery.getApiVersions).not.toHaveBeenCalled();
  });

  test('returns undefined when the group is not served', async () => {
    await expect(CustomResourceFactory.resolve(discovery, 'widgets.example.com')).resolves.toBeUndefined();
    expect(discovery.getApiResources).not.toHaveBeenCalled();
  });

  test('uses the preferred version when it serves the resource', async () => {
    const factory = await CustomResourceFactory.resolve(discovery, 'operatorconditions.operators.coreos.com');
    expect(factory?.version).toEqual('v2');
    expect(discovery.getApiResources).toHaveBeenCalledOnce();
  });

  test('returns undefined when the resource is not served', async () => {
    await expect(
      CustomResourceFactory.resolve(discovery, 'subscriptions.operators.coreos.com'),
    ).resolves.toBeUndefined();
  });

  test('builds a factory listing the resources once when the resource cannot be watched', async () => {
    const factory = await CustomResourceFactory.resolve(discovery, 'nowatches.operators.coreos.com');
    expect(factory?.watchable).toBeFalsy();
    expect(factory?.permissions).toEqual({
      isNamespaced: false,
      permissionsRequests: [{ verb: 'list', group: 'operators.coreos.com', resource: 'nowatches' }],
    });
  });

  test('returns undefined when the resource cannot be listed', async () => {
    await expect(CustomResourceFactory.resolve(discovery, 'nolists.operators.coreos.com')).resolves.toBeUndefined();
  });
});

describe('createInformer', () => {
  let kubeconfig: KubeConfigSingleContext;
  const listNamespacedCustomObject = vi.fn();
  const listClusterCustomObject = vi.fn();

  beforeEach(() => {
    const kc = new KubeConfig();
    const context = { name: 'ctx', cluster: 'cluster', user: 'user', namespace: 'olm' };
    kc.loadFromOptions({
      contexts: [context],
      clusters: [{ name: 'cluster', server: 'https://cluster', skipTLSVerify: true }],
      users: [{ name: 'user' }],
      currentContext: 'ctx',
    });
    kubeconfig = new KubeConfigSingleContext(kc, context);
    vi.spyOn(KubeConfig.prototype, 'makeApiClient').mockReturnValue({
      listNamespacedCustomObject,
      listClusterCustomObject,
    } as unknown as CustomObjectsApi);
  });

  test('watches the namespace of the kubeconfig for a namespaced resource', async () => {
    const factory = new CustomResourceFactory({
      resource: 'catalogsources.operators.coreos.com',
      kind: 'CatalogSource',
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      plural: 'catalogsources',
      namespaced: true,
    });
    factory.createInformer(kubeconfig);
    expect(ResourceInformer).toHaveBeenCalledWith({
      kubeconfig,
      path: '/apis/operators.coreos.com/v1alpha1/namespaces/olm/catalogsources',
      listFn: expect.any(Function),
      kind: 'CatalogSource',
      plural: 'catalogsources.operators.coreos.com',
      watch: true,
    });
    const listFn = vi.mocked(ResourceInformer).mock.calls[0]![0].listFn as () => Promise<KubernetesObject>;
    await listFn();
    expect(listNamespacedCustomObject).toHaveBeenCalledWith({
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      namespace: 'olm',
      plural: 'catalogsources',
    });
  });

  test('watches the cluster for a cluster-scoped resource', async () => {
    const factory = new CustomResourceFactory({
      resource: 'clustercatalogs.olm.operatorframework.io',
      kind: 'ClusterCatalog',
      group: 'olm.operatorframework.io',
      version: 'v1',
      plural: 'clustercatalogs',
      namespaced: false,
    });
    factory.createInformer(kubeconfig);
    expect(ResourceInformer).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/apis/olm.operatorframework.io/v1/clustercatalogs' }),
    );
    const listFn = vi.mocked(ResourceInformer).mock.calls[0]![0].listFn as () => Promise<KubernetesObject>;
    await listFn();
    expect(listClusterCustomObject).toHaveBeenCalledWith({
      group: 'olm.operatorframework.io',
      version: 'v1',
      plural: 'clustercatalogs',
    });
  });

  test('lists the resources once for a resource which cannot be watched', () => {
    const factory = new CustomResourceFactory({
      resource: 'packagemanifests.packages.operators.coreos.com',
      kind: 'PackageManifest',
      group: 'packages.operators.coreos.com',
      version: 'v1',
      plural: 'packagemanifests',
      namespaced: true,
      watchable: false,
    });
    factory.createInformer(kubeconfig);
    expect(ResourceInformer).toHaveBeenCalledWith(expect.objectContaining({ watch: false }));
  });
});
