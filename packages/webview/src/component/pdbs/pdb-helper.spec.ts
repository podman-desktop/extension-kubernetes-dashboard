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

import type { V1PodDisruptionBudget } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { PdbHelper } from './pdb-helper';

let helper: PdbHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new PdbHelper();
});

test('expect basic UI conversion', async () => {
  const pdb = {
    metadata: {
      name: 'my-pdb',
      namespace: 'default',
      uid: 'uid-pdb',
    },
    spec: { minAvailable: 1 },
    status: {},
  } as V1PodDisruptionBudget;
  const ui = helper.getPdbUI(pdb);
  expect(ui.kind).toEqual('PodDisruptionBudget');
  expect(ui.name).toEqual('my-pdb');
  expect(ui.namespace).toEqual('default');
});

test('expect minAvailable and maxUnavailable as strings', async () => {
  const pdb = {
    metadata: { name: 'pdb1' },
    spec: { minAvailable: 2, maxUnavailable: 1 },
    status: {},
  } as V1PodDisruptionBudget;
  const ui = helper.getPdbUI(pdb);
  expect(ui.minAvailable).toEqual('2');
  expect(ui.maxUnavailable).toEqual('1');
});

test('expect status fields with defaults', async () => {
  const pdb = {
    metadata: { name: 'pdb2' },
    spec: {},
    status: {
      currentHealthy: 3,
      desiredHealthy: 2,
      disruptionsAllowed: 1,
      expectedPods: 4,
    },
  } as V1PodDisruptionBudget;
  const ui = helper.getPdbUI(pdb);
  expect(ui.currentHealthy).toEqual(3);
  expect(ui.desiredHealthy).toEqual(2);
  expect(ui.allowedDisruptions).toEqual(1);
  expect(ui.expectedPods).toEqual(4);
});
