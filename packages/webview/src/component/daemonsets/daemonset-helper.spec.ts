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

import type { V1DaemonSet } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { DaemonSetHelper } from './daemonset-helper';

let daemonSetHelper: DaemonSetHelper;

beforeEach(() => {
  vi.clearAllMocks();
  daemonSetHelper = new DaemonSetHelper();
});

test('expect basic UI conversion', async () => {
  const daemonSet = {
    metadata: {
      name: 'my-daemonset',
      namespace: 'test-namespace',
      uid: 'test-uid-123',
    },
    status: {
      desiredNumberScheduled: 3,
      numberReady: 3,
      currentNumberScheduled: 3,
      updatedNumberScheduled: 3,
      numberAvailable: 3,
    },
  } as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.kind).toEqual('DaemonSet');
  expect(daemonSetUI.name).toEqual('my-daemonset');
  expect(daemonSetUI.namespace).toEqual('test-namespace');
  expect(daemonSetUI.uid).toEqual('test-uid-123');
  expect(daemonSetUI.desired).toEqual(3);
  expect(daemonSetUI.ready).toEqual(3);
});

test('expect RUNNING status when desired > 0 and ready equals desired', async () => {
  const daemonSet = {
    metadata: { name: 'ds' },
    status: { desiredNumberScheduled: 2, numberReady: 2 },
  } as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.status).toEqual('RUNNING');
});

test('expect DEGRADED status when desired > 0 and ready < desired', async () => {
  const daemonSet = {
    metadata: { name: 'ds' },
    status: { desiredNumberScheduled: 3, numberReady: 1 },
  } as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.status).toEqual('DEGRADED');
});

test('expect STOPPED status when desired is 0', async () => {
  const daemonSet = {
    metadata: { name: 'ds' },
    status: { desiredNumberScheduled: 0, numberReady: 0 },
  } as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.status).toEqual('STOPPED');
});

test('expect nodeSelector formatted as key=value pairs', async () => {
  const daemonSet = {
    metadata: { name: 'ds' },
    spec: {
      template: {
        spec: {
          nodeSelector: { 'kubernetes.io/os': 'linux', 'node-role': 'worker' },
        },
      },
    },
    status: { desiredNumberScheduled: 1, numberReady: 1 },
  } as unknown as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.nodeSelector).toEqual('kubernetes.io/os=linux, node-role=worker');
});

test('expect default values when fields are missing', async () => {
  const daemonSet = { metadata: {} } as V1DaemonSet;
  const daemonSetUI = daemonSetHelper.getDaemonSetUI(daemonSet);
  expect(daemonSetUI.name).toEqual('');
  expect(daemonSetUI.namespace).toEqual('');
  expect(daemonSetUI.uid).toEqual('');
  expect(daemonSetUI.desired).toEqual(0);
  expect(daemonSetUI.ready).toEqual(0);
  expect(daemonSetUI.nodeSelector).toEqual('');
  expect(daemonSetUI.status).toEqual('STOPPED');
});
