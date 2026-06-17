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

import type { V1StatefulSet } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { StatefulSetHelper } from './statefulset-helper';

let statefulSetHelper: StatefulSetHelper;

beforeEach(() => {
  vi.clearAllMocks();
  statefulSetHelper = new StatefulSetHelper();
});

test('expect basic UI conversion', async () => {
  const statefulSet = {
    metadata: {
      name: 'my-statefulset',
      namespace: 'test-namespace',
      uid: 'test-uid-456',
    },
    spec: { replicas: 3 },
    status: { readyReplicas: 3, updatedReplicas: 3 },
  } as V1StatefulSet;
  const statefulSetUI = statefulSetHelper.getStatefulSetUI(statefulSet);
  expect(statefulSetUI.kind).toEqual('StatefulSet');
  expect(statefulSetUI.name).toEqual('my-statefulset');
  expect(statefulSetUI.namespace).toEqual('test-namespace');
  expect(statefulSetUI.uid).toEqual('test-uid-456');
  expect(statefulSetUI.replicas).toEqual(3);
  expect(statefulSetUI.ready).toEqual(3);
});

test('expect RUNNING status when replicas > 0 and ready equals replicas', async () => {
  const statefulSet = {
    metadata: { name: 'sts' },
    spec: { replicas: 2 },
    status: { readyReplicas: 2 },
  } as V1StatefulSet;
  const statefulSetUI = statefulSetHelper.getStatefulSetUI(statefulSet);
  expect(statefulSetUI.status).toEqual('RUNNING');
});

test('expect DEGRADED status when replicas > 0 and ready < replicas', async () => {
  const statefulSet = {
    metadata: { name: 'sts' },
    spec: { replicas: 3 },
    status: { readyReplicas: 1 },
  } as V1StatefulSet;
  const statefulSetUI = statefulSetHelper.getStatefulSetUI(statefulSet);
  expect(statefulSetUI.status).toEqual('DEGRADED');
});

test('expect STOPPED status when replicas is 0', async () => {
  const statefulSet = {
    metadata: { name: 'sts' },
    spec: { replicas: 0 },
    status: { readyReplicas: 0 },
  } as V1StatefulSet;
  const statefulSetUI = statefulSetHelper.getStatefulSetUI(statefulSet);
  expect(statefulSetUI.status).toEqual('STOPPED');
});

test('expect upToDate from status.updatedReplicas', async () => {
  const statefulSet = {
    metadata: { name: 'sts' },
    spec: { replicas: 5 },
    status: { readyReplicas: 5, updatedReplicas: 3 },
  } as V1StatefulSet;
  const statefulSetUI = statefulSetHelper.getStatefulSetUI(statefulSet);
  expect(statefulSetUI.upToDate).toEqual(3);
});
