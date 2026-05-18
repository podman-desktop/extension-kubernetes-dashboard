/**********************************************************************
 * Copyright (C) 2023-2026 Red Hat, Inc.
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

/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, expect, test, vi } from 'vitest';
import type { V1Pod } from '@kubernetes/client-node';

import { PodHelper } from './pod-helper';

let podHelper: PodHelper;

beforeEach(() => {
  vi.resetAllMocks();
  podHelper = new PodHelper();
});

const podInfo = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'my-pod',
    namespace: 'test-namespace',
    ownerReferences: [
      {
        apiVersion: 'apps/v1',
        kind: 'ReplicaSet',
        name: 'my-replicaset-abc123',
        controller: true,
      },
    ],
  },
  status: {
    containerStatuses: [
      {
        containerID: 'container-1',
        name: 'container-1-name',
        restartCount: 2,
        state: {
          running: {},
        },
      },
      {
        containerID: 'container-2',
        name: 'container-2-name',
        restartCount: 1,
        state: {
          terminated: {},
        },
      },
      {
        containerID: 'container-3',
        name: 'container-3-name',
        restartCount: 0,
        state: {
          waiting: {},
        },
      },
    ],
    qosClass: 'Burstable',
  },
  spec: {
    nodeName: 'test-node',
  },
} as unknown as V1Pod;

test('Expect to get node and namespace from pod info', () => {
  const pod = podHelper.getPodUI(podInfo);

  expect(pod.kind).toBe('Pod');
  expect(pod.name).toBe('my-pod');
  expect(pod.node).toBe('test-node');
  expect(pod.namespace).toBe('test-namespace');
});

test('Expect to get container status from pod info', () => {
  const pod = podHelper.getPodUI(podInfo);

  expect(pod.containers).toHaveLength(3);

  expect(pod.containers[0].Id).toBe('container-1');
  expect(pod.containers[0].Names).toBe('container-1-name');
  expect(pod.containers[0].Status).toBe('running');

  expect(pod.containers[1].Id).toBe('container-2');
  expect(pod.containers[1].Names).toBe('container-2-name');
  expect(pod.containers[1].Status).toBe('terminated');

  expect(pod.containers[2].Id).toBe('container-3');
  expect(pod.containers[2].Names).toBe('container-3-name');
  expect(pod.containers[2].Status).toBe('waiting');
});

test('Expect to get total restart count from pod info', () => {
  const pod = podHelper.getPodUI(podInfo);

  expect(pod.restarts).toBe(3);
});

test('Expect restarts to be 0 when no container statuses', () => {
  const pod = podHelper.getPodUI({
    metadata: { name: 'no-containers' },
    status: {},
    spec: {},
  } as unknown as V1Pod);

  expect(pod.restarts).toBe(0);
});

test('Expect to get controlledBy from owner references', () => {
  const pod = podHelper.getPodUI(podInfo);

  expect(pod.controlledBy).toBe('ReplicaSet');
});

test('Expect controlledBy to be undefined when no owner references', () => {
  const pod = podHelper.getPodUI({
    metadata: { name: 'no-owner' },
    status: {},
    spec: {},
  } as unknown as V1Pod);

  expect(pod.controlledBy).toBeUndefined();
});

test('Expect controlledBy to be undefined when no controller owner reference', () => {
  const pod = podHelper.getPodUI({
    metadata: {
      name: 'non-controller-owner',
      ownerReferences: [
        {
          apiVersion: 'v1',
          kind: 'Service',
          name: 'my-service',
          controller: false,
        },
      ],
    },
    status: {},
    spec: {},
  } as unknown as V1Pod);

  expect(pod.controlledBy).toBeUndefined();
});

test('Expect to get QoS class from pod info', () => {
  const pod = podHelper.getPodUI(podInfo);

  expect(pod.qosClass).toBe('Burstable');
});

test('Expect qosClass to be undefined when not set', () => {
  const pod = podHelper.getPodUI({
    metadata: { name: 'no-qos' },
    status: {},
    spec: {},
  } as unknown as V1Pod);

  expect(pod.qosClass).toBeUndefined();
});
