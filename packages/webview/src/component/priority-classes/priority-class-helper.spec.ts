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

import type { KubernetesObject } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { PriorityClassHelper } from './priority-class-helper';

let helper: PriorityClassHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new PriorityClassHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      name: 'high-priority',
      uid: 'uid-pc',
    },
    value: 1000000,
    globalDefault: false,
    preemptionPolicy: 'PreemptLowerPriority',
    description: 'High priority class',
  } as KubernetesObject;
  const ui = helper.getPriorityClassUI(obj);
  expect(ui.kind).toEqual('PriorityClass');
  expect(ui.name).toEqual('high-priority');
  expect(ui.uid).toEqual('uid-pc');
});

test('expect value, globalDefault, and preemptionPolicy fields', async () => {
  const obj = {
    metadata: { name: 'pc1' },
    value: 500,
    globalDefault: true,
    preemptionPolicy: 'Never',
  } as KubernetesObject;
  const ui = helper.getPriorityClassUI(obj);
  expect(ui.value).toEqual(500);
  expect(ui.globalDefault).toEqual('true');
  expect(ui.preemptionPolicy).toEqual('Never');
});

test('expect defaults when fields are missing', async () => {
  const obj = {
    metadata: { name: 'pc2' },
  } as KubernetesObject;
  const ui = helper.getPriorityClassUI(obj);
  expect(ui.value).toEqual(0);
  expect(ui.globalDefault).toEqual('false');
  expect(ui.preemptionPolicy).toEqual('PreemptLowerPriority');
});
