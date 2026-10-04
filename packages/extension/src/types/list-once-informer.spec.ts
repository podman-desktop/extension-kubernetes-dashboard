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

import type { KubernetesListObject, KubernetesObject } from '@kubernetes/client-node';
import { ADD, DELETE, ERROR, UPDATE } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ListOnceInformer } from './list-once-informer.js';

const listFn = vi.fn<() => Promise<KubernetesListObject<KubernetesObject>>>();

function listOf(...names: [string, string][]): KubernetesListObject<KubernetesObject> {
  return { items: names.map(([namespace, name]) => ({ metadata: { name, namespace } })) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

test('start lists the objects and emits an add event for each', async () => {
  listFn.mockResolvedValue(listOf(['ns1', 'obj1'], ['ns2', 'obj2']));
  const informer = new ListOnceInformer(listFn);
  const onAdd = vi.fn();
  informer.on(ADD, onAdd);

  await informer.start();

  expect(listFn).toHaveBeenCalledOnce();
  expect(onAdd).toHaveBeenCalledTimes(2);
  expect(informer.list().map(o => o.metadata?.name)).toEqual(['obj1', 'obj2']);
  expect(informer.list('ns2').map(o => o.metadata?.name)).toEqual(['obj2']);
  expect(informer.get('obj1', 'ns1')?.metadata?.name).toEqual('obj1');
  expect(informer.get('obj1', 'ns2')).toBeUndefined();
});

test('the objects are not updated after start', async () => {
  vi.useFakeTimers();
  try {
    listFn.mockResolvedValue(listOf(['ns1', 'obj1']));
    const informer = new ListOnceInformer(listFn);
    await informer.start();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(listFn).toHaveBeenCalledOnce();
  } finally {
    vi.useRealTimers();
  }
});

test('starting again lists again and emits the differences', async () => {
  listFn.mockResolvedValueOnce(listOf(['ns1', 'kept'], ['ns1', 'removed']));
  listFn.mockResolvedValueOnce(listOf(['ns1', 'kept'], ['ns1', 'added']));
  const informer = new ListOnceInformer(listFn);
  await informer.start();
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  informer.on(ADD, onAdd);
  informer.on(UPDATE, onUpdate);
  informer.on(DELETE, onDelete);

  await informer.start();

  expect(onAdd).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ metadata: { name: 'added', namespace: 'ns1' } }),
  );
  expect(onUpdate).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ metadata: { name: 'kept', namespace: 'ns1' } }),
  );
  expect(onDelete).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ metadata: { name: 'removed', namespace: 'ns1' } }),
  );
  expect(informer.list().map(o => o.metadata?.name)).toEqual(['kept', 'added']);
});

test('a list error is emitted as an error event', async () => {
  const error = new Error('forbidden');
  listFn.mockRejectedValue(error);
  const informer = new ListOnceInformer(listFn);
  const onError = vi.fn();
  informer.on(ERROR, onError);

  await informer.start();

  expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  expect(informer.list()).toEqual([]);
});

test('the result of a list received after stop is ignored', async () => {
  let resolveList: (list: KubernetesListObject<KubernetesObject>) => void = () => {};
  listFn.mockReturnValue(new Promise(resolve => (resolveList = resolve)));
  const informer = new ListOnceInformer(listFn);
  const onAdd = vi.fn();
  informer.on(ADD, onAdd);

  const started = informer.start();
  await informer.stop();
  resolveList(listOf(['ns1', 'obj1']));
  await started;

  expect(onAdd).not.toHaveBeenCalled();
  expect(informer.list()).toEqual([]);
});

test('off removes a callback', async () => {
  listFn.mockResolvedValue(listOf(['ns1', 'obj1']));
  const informer = new ListOnceInformer(listFn);
  const onAdd = vi.fn();
  informer.on(ADD, onAdd);
  informer.off(ADD, onAdd);
  await informer.start();
  expect(onAdd).not.toHaveBeenCalled();
});
