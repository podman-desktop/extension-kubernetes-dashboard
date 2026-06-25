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

import { EndpointSliceHelper } from './endpoint-slice-helper';

let helper: EndpointSliceHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new EndpointSliceHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'my-slice',
      namespace: 'default',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    addressType: 'IPv4',
    ports: [],
    endpoints: [],
  } as unknown as KubernetesObject;

  const ui = helper.getEndpointSliceUI(obj);
  expect(ui.kind).toEqual('EndpointSlice');
  expect(ui.name).toEqual('my-slice');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.selected).toEqual(false);
});

test('expect addressType to be mapped', async () => {
  const obj = {
    metadata: { name: 'slice-1' },
    addressType: 'IPv6',
  } as unknown as KubernetesObject;

  const ui = helper.getEndpointSliceUI(obj);
  expect(ui.addressType).toEqual('IPv6');
});

test('expect ports formatted as port/protocol', async () => {
  const obj = {
    metadata: { name: 'slice-1' },
    addressType: 'IPv4',
    ports: [
      { port: 80, protocol: 'TCP' },
      { port: 443, protocol: 'UDP' },
    ],
    endpoints: [],
  } as unknown as KubernetesObject;

  const ui = helper.getEndpointSliceUI(obj);
  expect(ui.ports).toEqual('80/TCP, 443/UDP');
});

test('expect endpoints count', async () => {
  const obj = {
    metadata: { name: 'slice-1' },
    addressType: 'IPv4',
    endpoints: [{ addresses: ['10.0.0.1'] }, { addresses: ['10.0.0.2'] }, { addresses: ['10.0.0.3'] }],
  } as unknown as KubernetesObject;

  const ui = helper.getEndpointSliceUI(obj);
  expect(ui.endpoints).toEqual(3);
});
