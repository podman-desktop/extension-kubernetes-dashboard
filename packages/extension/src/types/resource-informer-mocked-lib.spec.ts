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

import type { Cluster, Context, ListWatch, User, V1ObjectMeta } from '@kubernetes/client-node';
import { ApiException, DELETE, ERROR, KubeConfig, UPDATE } from '@kubernetes/client-node';
import * as kubernetesClient from '@kubernetes/client-node';
import { expect, test, vi } from 'vitest';

import { KubeConfigSingleContext } from './kubeconfig-single-context.js';
import { ResourceInformer } from './resource-informer.js';

vi.mock('@kubernetes/client-node', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('@kubernetes/client-node')>('@kubernetes/client-node');
  return {
    ...actual,
    makeInformer: vi.fn(),
  };
});

interface MyResource {
  apiVersion?: string;
  kind?: string;
  metadata?: V1ObjectMeta;
}

const contexts = [
  {
    name: 'context1',
    cluster: 'cluster1',
    user: 'user1',
    namespace: 'ns1',
  },
  {
    name: 'context2',
    cluster: 'cluster2',
    user: 'user2',
  },
] as Context[];

const clusters = [
  {
    name: 'cluster1',
  },
  {
    name: 'cluster2',
  },
] as Cluster[];

const users = [
  {
    name: 'user1',
  },
  {
    name: 'user2',
  },
] as User[];

const kcWith2contexts = {
  contexts,
  clusters,
  users,
} as unknown as KubeConfig;

test('ResourceInformer should fire onCacheUpdated event with countChanged to false when resources are updated', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const items = [
    { metadata: { name: 'res1', namespace: 'ns1' } },
    { metadata: { name: 'res2', namespace: 'ns1' } },
  ] as MyResource[];
  listFn.mockResolvedValue({ items: items });
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: vi.fn().mockResolvedValue({}),
  } as unknown as ListWatch<MyResource>);
  onCB.mockImplementation((event: string, f: (obj: MyResource) => void) => {
    if (event === UPDATE) {
      f({ metadata: { ...items[0]!.metadata, resourceVersion: '2' } });
    }
  });
  const onCacheUpdatedCB = vi.fn();
  informer.onCacheUpdated(onCacheUpdatedCB);
  informer.start();
  await vi.waitFor(() => {
    expect(onCacheUpdatedCB).toHaveBeenCalledWith({ kubeconfig, resourceName: 'myresources', countChanged: false });
  });
});

test('ResourceInformer should fire onOffline event is informer fails', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: vi.fn().mockResolvedValue({}),
  } as unknown as ListWatch<MyResource>);
  const onOfflineCB = vi.fn();
  onCB.mockImplementation((e: string, f) => {
    if (e === ERROR) {
      f(new ApiException(500, 'an error', {}, {}));
    }
  });
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(onOfflineCB).toHaveBeenCalledWith({
    kubeconfig,
    offline: true,
    reason: `Error: HTTP-Code: 500
Message: an error
Body: {}
Headers: {}`,
    resourceName: 'myresources',
  });
});

test('reconnect should do nothing if there is no error', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  const startMock = vi.fn().mockResolvedValue({});
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: startMock,
  } as unknown as ListWatch<MyResource>);
  const onOfflineCB = vi.fn();
  onCB.mockImplementation((e: string, _f) => {
    if (e === ERROR) {
      // do nothing
    }
  });
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(startMock).toHaveBeenCalledOnce();
  startMock.mockClear();
  informer.reconnect();
  expect(startMock).not.toHaveBeenCalled();
});

test('reconnect should call start again if there is an error', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  const startMock = vi.fn().mockResolvedValue({});
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: startMock,
  } as unknown as ListWatch<MyResource>);
  const onOfflineCB = vi.fn();
  onCB.mockImplementation((e: string, f) => {
    if (e === ERROR) {
      f('an error');
    }
  });
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(startMock).toHaveBeenCalledOnce();
  startMock.mockClear();
  informer.reconnect();
  expect(startMock).toHaveBeenCalled();
});

test('informer is stopped when disposed', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  const startMock = vi.fn().mockResolvedValue({});
  const stopMock = vi.fn().mockResolvedValue({});
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: startMock,
    stop: stopMock,
  } as unknown as ListWatch<MyResource>);
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(startMock).toHaveBeenCalledOnce();
  startMock.mockClear();
  informer.dispose();
  expect(stopMock).toHaveBeenCalled();
});

test('ResourceInformer should fire onObjectDeleted event when a resource is deleted', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const items = [
    { metadata: { name: 'res1', namespace: 'ns1' } },
    { metadata: { name: 'res2', namespace: 'ns1' } },
  ] as MyResource[];
  listFn.mockResolvedValue({ items: items });
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCB = vi.fn();
  vi.mocked(kubernetesClient.makeInformer).mockReturnValue({
    on: onCB,
    start: vi.fn().mockResolvedValue({}),
  } as unknown as ListWatch<MyResource>);
  onCB.mockImplementation((event: string, f: (obj: MyResource) => void) => {
    if (event === DELETE) {
      f(items[0]!);
    }
  });
  const onCacheUpdatedCB = vi.fn();
  informer.onObjectDeleted(onCacheUpdatedCB);
  informer.start();
  await vi.waitFor(() => {
    expect(onCacheUpdatedCB).toHaveBeenCalledWith({
      kubeconfig,
      resourceName: 'myresources',
      name: 'res1',
      namespace: 'ns1',
    });
  });
});
