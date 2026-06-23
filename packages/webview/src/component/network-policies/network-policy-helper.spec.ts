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

import type { V1NetworkPolicy } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { NetworkPolicyHelper } from './network-policy-helper';

let helper: NetworkPolicyHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new NetworkPolicyHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'deny-all',
      namespace: 'default',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: {
      podSelector: {},
      policyTypes: ['Ingress'],
    },
  } as unknown as V1NetworkPolicy;

  const ui = helper.getNetworkPolicyUI(obj);
  expect(ui.kind).toEqual('NetworkPolicy');
  expect(ui.name).toEqual('deny-all');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.selected).toEqual(false);
});

test('expect policyTypes joined', async () => {
  const obj = {
    metadata: { name: 'np-1' },
    spec: {
      podSelector: {},
      policyTypes: ['Ingress', 'Egress'],
    },
  } as unknown as V1NetworkPolicy;

  const ui = helper.getNetworkPolicyUI(obj);
  expect(ui.policyTypes).toEqual('Ingress, Egress');
});

test('expect podSelector from matchLabels as k=v', async () => {
  const obj = {
    metadata: { name: 'np-1' },
    spec: {
      podSelector: {
        matchLabels: { app: 'web', tier: 'frontend' },
      },
      policyTypes: ['Ingress'],
    },
  } as unknown as V1NetworkPolicy;

  const ui = helper.getNetworkPolicyUI(obj);
  expect(ui.podSelector).toEqual('app=web, tier=frontend');
});

test('expect podSelector as <all pods> when matchLabels is empty', async () => {
  const obj = {
    metadata: { name: 'np-1' },
    spec: {
      podSelector: { matchLabels: {} },
      policyTypes: ['Ingress'],
    },
  } as unknown as V1NetworkPolicy;

  const ui = helper.getNetworkPolicyUI(obj);
  expect(ui.podSelector).toEqual('<all pods>');
});
