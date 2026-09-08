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

import type { V2HorizontalPodAutoscaler } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { HpaHelper } from './hpa-helper';

let helper: HpaHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new HpaHelper();
});

test('expect basic UI conversion', async () => {
  const hpa = {
    metadata: {
      name: 'my-hpa',
      namespace: 'default',
      uid: 'uid-789',
    },
    spec: { maxReplicas: 10 },
    status: {},
  } as V2HorizontalPodAutoscaler;
  const ui = helper.getHpaUI(hpa);
  expect(ui.kind).toEqual('HorizontalPodAutoscaler');
  expect(ui.name).toEqual('my-hpa');
  expect(ui.namespace).toEqual('default');
});

test('expect Resource metrics formatting "name: current%/target%"', async () => {
  const hpa = {
    metadata: { name: 'hpa1' },
    spec: {
      maxReplicas: 5,
      metrics: [
        {
          type: 'Resource',
          resource: { name: 'cpu', target: { averageUtilization: 80 } },
        },
      ],
    },
    status: {
      currentMetrics: [
        {
          type: 'Resource',
          resource: { name: 'cpu', current: { averageUtilization: 45 } },
        },
      ],
    },
  } as V2HorizontalPodAutoscaler;
  const ui = helper.getHpaUI(hpa);
  expect(ui.metrics).toEqual('cpu: 45%/80%');
});

test('expect minReplicas and maxReplicas defaults', async () => {
  const hpa = {
    metadata: { name: 'hpa2' },
    spec: { maxReplicas: 10, minReplicas: 2 },
    status: {},
  } as V2HorizontalPodAutoscaler;
  const ui = helper.getHpaUI(hpa);
  expect(ui.minReplicas).toEqual(2);
  expect(ui.maxReplicas).toEqual(10);
});
