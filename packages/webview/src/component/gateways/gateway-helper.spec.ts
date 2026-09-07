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

import { GatewayHelper } from './gateway-helper';

let helper: GatewayHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new GatewayHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'my-gateway',
      namespace: 'default',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: { gatewayClassName: 'istio' },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayUI(obj);
  expect(ui.kind).toEqual('Gateway');
  expect(ui.name).toEqual('my-gateway');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.selected).toEqual(false);
});

test('expect gatewayClassName mapped', async () => {
  const obj = {
    metadata: { name: 'gw-1' },
    spec: { gatewayClassName: 'nginx' },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayUI(obj);
  expect(ui.gatewayClassName).toEqual('nginx');
});

test('expect listeners formatted as name:port/protocol', async () => {
  const obj = {
    metadata: { name: 'gw-1' },
    spec: {
      listeners: [
        { name: 'http', port: 80, protocol: 'HTTP' },
        { name: 'https', port: 443, protocol: 'HTTPS' },
      ],
    },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayUI(obj);
  expect(ui.listeners).toEqual('http:80/HTTP, https:443/HTTPS');
});

test('expect addresses from status', async () => {
  const obj = {
    metadata: { name: 'gw-1' },
    spec: {},
    status: {
      addresses: [
        { type: 'IPAddress', value: '192.168.1.1' },
        { type: 'IPAddress', value: '192.168.1.2' },
      ],
    },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayUI(obj);
  expect(ui.addresses).toEqual('192.168.1.1, 192.168.1.2');
});
