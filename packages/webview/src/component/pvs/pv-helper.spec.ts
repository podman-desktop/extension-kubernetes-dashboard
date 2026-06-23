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

import type { V1PersistentVolume } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { PvHelper } from './pv-helper';

let helper: PvHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new PvHelper();
});

test('expect basic UI conversion with Bound status as RUNNING', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'pv-1',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: {
      storageClassName: 'standard',
      capacity: { storage: '10Gi' },
      accessModes: ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy: 'Retain',
    },
    status: { phase: 'Bound' },
  } as unknown as V1PersistentVolume;

  const ui = helper.getPvUI(obj);
  expect(ui.kind).toEqual('PersistentVolume');
  expect(ui.name).toEqual('pv-1');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.storageClass).toEqual('standard');
  expect(ui.capacity).toEqual('10Gi');
});

test('expect status RUNNING when phase is Available', async () => {
  const obj = {
    metadata: { name: 'pv-1' },
    spec: {},
    status: { phase: 'Available' },
  } as unknown as V1PersistentVolume;

  const ui = helper.getPvUI(obj);
  expect(ui.status).toEqual('RUNNING');
});

test('expect status STOPPED when phase is Released', async () => {
  const obj = {
    metadata: { name: 'pv-1' },
    spec: {},
    status: { phase: 'Released' },
  } as unknown as V1PersistentVolume;

  const ui = helper.getPvUI(obj);
  expect(ui.status).toEqual('STOPPED');
});

test('expect claim formatted as namespace/name and accessModes joined', async () => {
  const obj = {
    metadata: { name: 'pv-1' },
    spec: {
      claimRef: { namespace: 'production', name: 'data-claim' },
      accessModes: ['ReadWriteOnce', 'ReadOnlyMany'],
    },
    status: { phase: 'Bound' },
  } as unknown as V1PersistentVolume;

  const ui = helper.getPvUI(obj);
  expect(ui.claim).toEqual('production/data-claim');
  expect(ui.accessModes).toEqual('ReadWriteOnce, ReadOnlyMany');
});
