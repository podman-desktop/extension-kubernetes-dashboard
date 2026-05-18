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

import { beforeEach, expect, test, vi } from 'vitest';
import { LocalStoragePersistence } from './local-storage-persistence';

let persistence: LocalStoragePersistence;
let storage: Record<string, string>;

beforeEach(() => {
  storage = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key]),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
  });
  persistence = new LocalStoragePersistence();
});

test('load returns default items when no saved config', async () => {
  const items = await persistence.load('Pod', ['Name', 'Age', 'Status']);

  expect(items).toEqual([
    { id: 'Name', label: 'Name', enabled: true, originalOrder: 0 },
    { id: 'Age', label: 'Age', enabled: true, originalOrder: 1 },
    { id: 'Status', label: 'Status', enabled: true, originalOrder: 2 },
  ]);
});

test('load restores saved enabled state', async () => {
  storage['table-columns.Pod'] = JSON.stringify([
    { id: 'Name', enabled: true },
    { id: 'Age', enabled: false },
    { id: 'Status', enabled: true },
  ]);

  const items = await persistence.load('Pod', ['Name', 'Age', 'Status']);

  expect(items[0].enabled).toBe(true);
  expect(items[1].enabled).toBe(false);
  expect(items[2].enabled).toBe(true);
});

test('load defaults new columns to enabled', async () => {
  storage['table-columns.Pod'] = JSON.stringify([
    { id: 'Name', enabled: true },
    { id: 'Age', enabled: false },
  ]);

  const items = await persistence.load('Pod', ['Name', 'Age', 'Node']);

  expect(items).toHaveLength(3);
  expect(items[2].id).toBe('Node');
  expect(items[2].enabled).toBe(true);
});

test('load falls back to defaults on invalid JSON', async () => {
  storage['table-columns.Pod'] = 'invalid-json';

  const items = await persistence.load('Pod', ['Name', 'Age']);

  expect(items).toHaveLength(2);
  expect(items.every(i => i.enabled)).toBe(true);
});

test('save persists column configuration', async () => {
  await persistence.save('Pod', [
    { id: 'Name', label: 'Name', enabled: true, originalOrder: 0 },
    { id: 'Age', label: 'Age', enabled: false, originalOrder: 1 },
  ]);

  const saved = JSON.parse(storage['table-columns.Pod']);
  expect(saved).toEqual([
    { id: 'Name', enabled: true },
    { id: 'Age', enabled: false },
  ]);
});

test('reset clears saved config and returns defaults', async () => {
  storage['table-columns.Pod'] = JSON.stringify([{ id: 'Name', enabled: false }]);

  const items = await persistence.reset('Pod', ['Name', 'Age']);

  expect(storage['table-columns.Pod']).toBeUndefined();
  expect(items).toEqual([
    { id: 'Name', label: 'Name', enabled: true, originalOrder: 0 },
    { id: 'Age', label: 'Age', enabled: true, originalOrder: 1 },
  ]);
});
