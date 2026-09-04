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

import type { Cluster, Context, ListWatch, User, V1ObjectMeta } from '@kubernetes/client-node';
import { ApiException, DELETE, ERROR, KubeConfig, UPDATE } from '@kubernetes/client-node';
import type { Mock } from 'vitest';
import { afterEach, expect, test, vi } from 'vitest';

import { KubeConfigSingleContext } from './kubeconfig-single-context.js';
import { ResourceInformer } from './resource-informer.js';

// the jitter added to the retry delays would make the tests non-deterministic
vi.mock(import('node:crypto'), async importOriginal => ({
  ...(await importOriginal()),
  randomInt: vi.fn().mockReturnValue(0),
}));

afterEach(() => {
  vi.useRealTimers();
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

test('ResourceInformer should eventually return the list of resources', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const items = [{ metadata: { name: 'res1', namespace: 'ns1' } }, { metadata: { name: 'res2', namespace: 'ns1' } }];
  listFn.mockResolvedValue({ apiVersion: 'v8', items: items });
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const result = informer.start();
  await vi.waitFor(() => {
    const list = result.list();
    expect(list).toEqual(items.map(i => ({ apiVersion: 'v8', kind: 'MyResource', ...i })));
  });
});

test('ResourceInformer should fire onCacheUpdated event with countChanged to true when informer is started an resources exist', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const listFn = vi.fn();
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const items = [{ metadata: { name: 'res1', namespace: 'ns1' } }, { metadata: { name: 'res2', namespace: 'ns1' } }];
  listFn.mockResolvedValue({ items: items });
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn,
    kind: 'MyResource',
    plural: 'myresources',
  });
  const onCacheUpdatedCB = vi.fn();
  informer.onCacheUpdated(onCacheUpdatedCB);
  informer.start();
  await vi.waitFor(() => {
    expect(onCacheUpdatedCB).toHaveBeenCalledWith({ kubeconfig, resourceName: 'myresources', countChanged: true });
  });
});

test('ResourceInformer should fire onCacheUpdated event with countChanged to true when resources are deleted', async () => {
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
  const onCacheUpdatedCB = vi.fn();
  informer.onCacheUpdated(onCacheUpdatedCB);
  informer.start();
  await vi.waitFor(() => {
    expect(onCacheUpdatedCB).toHaveBeenCalledWith({ kubeconfig, resourceName: 'myresources', countChanged: true });
  });
});

test('ResourceInformer should not fire onOffline event is informer fails with a 404 error', async () => {
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
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(onOfflineCB).not.toHaveBeenCalled();
});

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
  vi.spyOn(informer, 'makeInformer').mockReturnValue({
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
  const informerMock = {
    on: vi.fn(),
    start: vi.fn(),
  } as unknown as ListWatch<MyResource>;
  vi.mocked(informerMock.start).mockResolvedValue();
  vi.spyOn(informer, 'makeInformer').mockReturnValue(informerMock);
  const onOfflineCB = vi.fn();
  vi.mocked(informerMock.on).mockImplementation((e: string, callback) => {
    if (e === ERROR) {
      callback(new ApiException(500, 'an error', {}, {}));
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
  vi.spyOn(informer, 'makeInformer').mockReturnValue({
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
  const informerMock = {
    on: vi.fn(),
    start: vi.fn(),
  } as unknown as ListWatch<MyResource>;
  vi.spyOn(informer, 'makeInformer').mockReturnValue(informerMock);
  vi.mocked(informerMock.start).mockResolvedValue();
  const onOfflineCB = vi.fn();
  vi.mocked(informerMock.on).mockImplementation((e: string, callback) => {
    if (e === ERROR) {
      callback('an error');
    }
  });
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(informerMock.start).toHaveBeenCalledOnce();
  vi.mocked(informerMock.start).mockClear();
  informer.reconnect();
  expect(informerMock.start).toHaveBeenCalled();
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
  vi.spyOn(informer, 'makeInformer').mockReturnValue({
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
  vi.spyOn(informer, 'makeInformer').mockReturnValue({
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

interface InformerMock {
  informer: ResourceInformer<MyResource>;
  kubeconfig: KubeConfigSingleContext;
  startMock: Mock;
  stopMock: Mock;
  fireError: (error: unknown) => void;
}

// creates a ResourceInformer with a mocked internal informer,
// giving access to the ERROR callback registered by the ResourceInformer
function createInformerWithMock(): InformerMock {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const kubeconfig = new KubeConfigSingleContext(kc, contexts[0]!);
  const informer = new ResourceInformer<MyResource>({
    kubeconfig,
    path: '/a/path',
    listFn: vi.fn(),
    kind: 'MyResource',
    plural: 'myresources',
  });
  const callbacks = new Map<string, (arg: unknown) => void>();
  const startMock = vi.fn().mockResolvedValue(undefined);
  const stopMock = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(informer, 'makeInformer').mockReturnValue({
    on: vi.fn().mockImplementation((event: string, cb: (arg: unknown) => void) => {
      callbacks.set(event, cb);
    }),
    start: startMock,
    stop: stopMock,
  } as unknown as ListWatch<MyResource>);
  return {
    informer,
    kubeconfig,
    startMock,
    stopMock,
    fireError: (error: unknown): void => callbacks.get(ERROR)?.(error),
  };
}

test('ResourceInformer should not go offline but restart the informer when the list request returns 429', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  expect(startMock).toHaveBeenCalledOnce();
  startMock.mockClear();

  fireError(new ApiException(429, 'Too Many Requests', {}, {}));
  expect(onOfflineCB).not.toHaveBeenCalled();
  expect(informer.isOffline()).toBeFalsy();

  // first retry happens after the base delay
  vi.advanceTimersByTime(999);
  expect(startMock).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(startMock).toHaveBeenCalledOnce();
});

test('ResourceInformer should restart the informer when the watch request returns 429', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  startMock.mockClear();

  // the watch request does not report the error as an ApiException,
  // but as an Error carrying a statusCode
  fireError(Object.assign(new Error('Too Many Requests'), { statusCode: 429 }));
  expect(onOfflineCB).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);
  expect(startMock).toHaveBeenCalledOnce();
});

test('ResourceInformer should honour the Retry-After header', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  informer.start();
  startMock.mockClear();

  fireError(new ApiException(429, 'Too Many Requests', {}, { 'Retry-After': '7' }));

  vi.advanceTimersByTime(6_999);
  expect(startMock).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(startMock).toHaveBeenCalledOnce();
});

test('ResourceInformer should honour retryAfterSeconds in the body when there is no Retry-After header', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  informer.start();
  startMock.mockClear();

  fireError(new ApiException(429, 'Too Many Requests', JSON.stringify({ details: { retryAfterSeconds: 4 } }), {}));

  vi.advanceTimersByTime(3_999);
  expect(startMock).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(startMock).toHaveBeenCalledOnce();
});

test('ResourceInformer should increase the delay between retries and go offline after too many 429', () => {
  vi.useFakeTimers();
  const { informer, kubeconfig, startMock, fireError } = createInformerWithMock();
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  startMock.mockClear();

  const error = new ApiException(429, 'Too Many Requests', {}, {});
  // the delay doubles at each retry
  for (const expectedDelay of [1_000, 2_000, 4_000, 8_000, 16_000]) {
    fireError(error);
    vi.advanceTimersByTime(expectedDelay - 1);
    expect(startMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(startMock).toHaveBeenCalledOnce();
    startMock.mockClear();
  }
  expect(onOfflineCB).not.toHaveBeenCalled();

  // the retries are exhausted, the informer goes offline
  fireError(error);
  expect(onOfflineCB).toHaveBeenCalledWith({
    kubeconfig,
    resourceName: 'myresources',
    offline: true,
    reason: String(error),
  });
  expect(informer.isOffline()).toBeTruthy();
  vi.advanceTimersByTime(60_000);
  expect(startMock).not.toHaveBeenCalled();
});

test('ResourceInformer should not restart the informer after a 429 if it has been disposed', () => {
  vi.useFakeTimers();
  const { informer, startMock, stopMock, fireError } = createInformerWithMock();
  informer.start();
  startMock.mockClear();

  fireError(new ApiException(429, 'Too Many Requests', {}, {}));
  informer.dispose();
  expect(stopMock).toHaveBeenCalled();

  vi.advanceTimersByTime(60_000);
  expect(startMock).not.toHaveBeenCalled();
});

test('ResourceInformer should not schedule a retry for a 429 received after being disposed', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  const onOfflineCB = vi.fn();
  informer.onOffline(onOfflineCB);
  informer.start();
  startMock.mockClear();

  informer.dispose();
  // the request in flight when the informer was disposed returns after the disposal
  fireError(new ApiException(429, 'Too Many Requests', {}, {}));

  vi.advanceTimersByTime(60_000);
  expect(startMock).not.toHaveBeenCalled();
  expect(onOfflineCB).not.toHaveBeenCalled();
});

test('ResourceInformer should cancel a pending retry when reconnecting', () => {
  vi.useFakeTimers();
  const { informer, startMock, fireError } = createInformerWithMock();
  informer.start();
  startMock.mockClear();

  // the informer is offline, and a retry is pending after a 429
  fireError(new ApiException(500, 'an error', {}, {}));
  fireError(new ApiException(429, 'Too Many Requests', {}, {}));

  informer.reconnect();
  expect(startMock).toHaveBeenCalledOnce();
  startMock.mockClear();

  // the pending retry has been cancelled, the informer is not started twice
  vi.advanceTimersByTime(60_000);
  expect(startMock).not.toHaveBeenCalled();
});
