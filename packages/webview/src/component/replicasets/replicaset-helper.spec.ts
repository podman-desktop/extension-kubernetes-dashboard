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

import type { V1ReplicaSet } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ReplicaSetHelper } from './replicaset-helper';

let replicaSetHelper: ReplicaSetHelper;

beforeEach(() => {
  vi.clearAllMocks();
  replicaSetHelper = new ReplicaSetHelper();
});

test('expect basic UI conversion', async () => {
  const replicaSet = {
    metadata: {
      name: 'my-replicaset',
      namespace: 'test-namespace',
      uid: 'test-uid-789',
    },
    spec: { replicas: 4 },
    status: { readyReplicas: 4, replicas: 4 },
  } as V1ReplicaSet;
  const replicaSetUI = replicaSetHelper.getReplicaSetUI(replicaSet);
  expect(replicaSetUI.kind).toEqual('ReplicaSet');
  expect(replicaSetUI.name).toEqual('my-replicaset');
  expect(replicaSetUI.namespace).toEqual('test-namespace');
  expect(replicaSetUI.uid).toEqual('test-uid-789');
  expect(replicaSetUI.desired).toEqual(4);
  expect(replicaSetUI.ready).toEqual(4);
});

test('expect RUNNING when desired > 0 and ready equals desired, DEGRADED otherwise, STOPPED when 0', async () => {
  const running = {
    metadata: { name: 'rs' },
    spec: { replicas: 2 },
    status: { readyReplicas: 2 },
  } as V1ReplicaSet;
  expect(replicaSetHelper.getReplicaSetUI(running).status).toEqual('RUNNING');

  const degraded = {
    metadata: { name: 'rs' },
    spec: { replicas: 3 },
    status: { readyReplicas: 1 },
  } as V1ReplicaSet;
  expect(replicaSetHelper.getReplicaSetUI(degraded).status).toEqual('DEGRADED');

  const stopped = {
    metadata: { name: 'rs' },
    spec: { replicas: 0 },
    status: { readyReplicas: 0 },
  } as V1ReplicaSet;
  expect(replicaSetHelper.getReplicaSetUI(stopped).status).toEqual('STOPPED');
});

test('expect owner from ownerReferences formatted as Kind/Name', async () => {
  const replicaSet = {
    metadata: {
      name: 'rs',
      ownerReferences: [{ kind: 'Deployment', name: 'my-deployment', uid: '', apiVersion: 'apps/v1' }],
    },
    spec: { replicas: 1 },
    status: { readyReplicas: 1 },
  } as V1ReplicaSet;
  const replicaSetUI = replicaSetHelper.getReplicaSetUI(replicaSet);
  expect(replicaSetUI.owner).toEqual('Deployment/my-deployment');
});

test('expect empty owner when no ownerReferences', async () => {
  const replicaSet = {
    metadata: { name: 'rs' },
    spec: { replicas: 1 },
    status: { readyReplicas: 1 },
  } as V1ReplicaSet;
  const replicaSetUI = replicaSetHelper.getReplicaSetUI(replicaSet);
  expect(replicaSetUI.owner).toEqual('');
});
