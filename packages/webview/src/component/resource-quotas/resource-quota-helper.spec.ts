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

import type { V1ResourceQuota } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ResourceQuotaHelper } from './resource-quota-helper';

let helper: ResourceQuotaHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new ResourceQuotaHelper();
});

test('expect basic UI conversion', async () => {
  const rq = {
    metadata: {
      name: 'my-quota',
      namespace: 'default',
      uid: 'uid-123',
    },
    spec: { hard: { cpu: '4' } },
    status: { hard: { cpu: '4' }, used: { cpu: '2' } },
  } as V1ResourceQuota;
  const ui = helper.getResourceQuotaUI(rq);
  expect(ui.kind).toEqual('ResourceQuota');
  expect(ui.name).toEqual('my-quota');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-123');
});

test('expect requestCount from status hard', async () => {
  const rq = {
    metadata: { name: 'q1' },
    status: {
      hard: { cpu: '4', memory: '8Gi' },
      used: { cpu: '1', memory: '2Gi' },
    },
  } as V1ResourceQuota;
  const ui = helper.getResourceQuotaUI(rq);
  expect(ui.requestCount).toEqual(2);
});

test('expect zero requestCount when no spec or status', async () => {
  const rq = {
    metadata: { name: 'empty' },
  } as V1ResourceQuota;
  const ui = helper.getResourceQuotaUI(rq);
  expect(ui.requestCount).toEqual(0);
});
