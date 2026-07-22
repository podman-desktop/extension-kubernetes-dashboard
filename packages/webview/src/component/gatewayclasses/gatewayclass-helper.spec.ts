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

import { GatewayClassHelper } from './gatewayclass-helper';

let helper: GatewayClassHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new GatewayClassHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'istio',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: {
      controllerName: 'istio.io/gateway-controller',
    },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayClassUI(obj);
  expect(ui.kind).toEqual('GatewayClass');
  expect(ui.name).toEqual('istio');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
});

test('expect controller from spec.controllerName', async () => {
  const obj = {
    metadata: { name: 'nginx' },
    spec: {
      controllerName: 'nginx.org/gateway-controller',
    },
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayClassUI(obj);
  expect(ui.controller).toEqual('nginx.org/gateway-controller');
});

test('expect controller empty when spec has no controllerName', async () => {
  const obj = {
    metadata: { name: 'empty' },
    spec: {},
  } as unknown as KubernetesObject;

  const ui = helper.getGatewayClassUI(obj);
  expect(ui.controller).toEqual('');
});
