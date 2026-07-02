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

import type { V1Lease } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { LeaseHelper } from './lease-helper';

let helper: LeaseHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new LeaseHelper();
});

test('expect basic UI conversion', async () => {
  const lease = {
    metadata: {
      name: 'my-lease',
      namespace: 'kube-system',
      uid: 'uid-lease',
    },
    spec: {},
  } as V1Lease;
  const ui = helper.getLeaseUI(lease);
  expect(ui.kind).toEqual('Lease');
  expect(ui.name).toEqual('my-lease');
  expect(ui.namespace).toEqual('kube-system');
});

test('expect holder and leaseDuration fields', async () => {
  const lease = {
    metadata: { name: 'lease1' },
    spec: {
      holderIdentity: 'node-1',
      leaseDurationSeconds: 40,
    },
  } as V1Lease;
  const ui = helper.getLeaseUI(lease);
  expect(ui.holder).toEqual('node-1');
  expect(ui.leaseDuration).toEqual('40s');
});

test('expect renewTime as ISO string', async () => {
  const lease = {
    metadata: { name: 'lease2' },
    spec: {
      renewTime: new Date('2026-01-15T10:30:00Z'),
    },
  } as V1Lease;
  const ui = helper.getLeaseUI(lease);
  expect(ui.renewTime).toEqual('2026-01-15T10:30:00.000Z');
});

test('expect empty strings when spec fields are missing', async () => {
  const lease = {
    metadata: { name: 'lease3' },
  } as V1Lease;
  const ui = helper.getLeaseUI(lease);
  expect(ui.holder).toEqual('');
  expect(ui.leaseDuration).toEqual('');
  expect(ui.renewTime).toEqual('');
});
