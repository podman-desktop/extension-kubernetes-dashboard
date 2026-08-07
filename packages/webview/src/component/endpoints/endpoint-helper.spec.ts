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

import type { V1Endpoints } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { EndpointHelper } from './endpoint-helper';

let helper: EndpointHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new EndpointHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'my-endpoint',
      namespace: 'default',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    subsets: [],
  } as unknown as V1Endpoints;

  const ui = helper.getEndpointUI(obj);
  expect(ui.kind).toEqual('Endpoints');
  expect(ui.name).toEqual('my-endpoint');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.selected).toEqual(false);
});

test('expect endpoints from subsets addresses joined by comma', async () => {
  const obj = {
    metadata: { name: 'ep-1' },
    subsets: [{ addresses: [{ ip: '10.0.0.1' }, { ip: '10.0.0.2' }] }, { addresses: [{ ip: '10.0.0.3' }] }],
  } as unknown as V1Endpoints;

  const ui = helper.getEndpointUI(obj);
  expect(ui.endpoints).toEqual('10.0.0.1, 10.0.0.2, 10.0.0.3');
});

test('expect ports from subsets formatted as port/protocol', async () => {
  const obj = {
    metadata: { name: 'ep-1' },
    subsets: [
      {
        ports: [
          { port: 80, protocol: 'TCP' },
          { port: 443, protocol: 'TCP' },
        ],
      },
      { ports: [{ port: 8080, protocol: 'UDP' }] },
    ],
  } as unknown as V1Endpoints;

  const ui = helper.getEndpointUI(obj);
  expect(ui.ports).toEqual('80/TCP, 443/TCP, 8080/UDP');
});
