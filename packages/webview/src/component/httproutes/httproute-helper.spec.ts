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

import { HttpRouteHelper } from './httproute-helper';

let helper: HttpRouteHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new HttpRouteHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'my-route',
      namespace: 'default',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: {},
  } as unknown as KubernetesObject;

  const ui = helper.getHttpRouteUI(obj);
  expect(ui.kind).toEqual('HTTPRoute');
  expect(ui.name).toEqual('my-route');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.selected).toEqual(false);
});

test('expect hostnames mapped', async () => {
  const obj = {
    metadata: { name: 'route-1' },
    spec: {
      hostnames: ['example.com', 'api.example.com'],
    },
  } as unknown as KubernetesObject;

  const ui = helper.getHttpRouteUI(obj);
  expect(ui.hostnames).toEqual(['example.com', 'api.example.com']);
});

test('expect parentRefs names joined', async () => {
  const obj = {
    metadata: { name: 'route-1' },
    spec: {
      parentRefs: [
        { name: 'gateway-1', namespace: 'default' },
        { name: 'gateway-2', namespace: 'default' },
      ],
    },
  } as unknown as KubernetesObject;

  const ui = helper.getHttpRouteUI(obj);
  expect(ui.parentRefs).toEqual('gateway-1, gateway-2');
});

test('expect backendRefs formatted as name:port', async () => {
  const obj = {
    metadata: { name: 'route-1' },
    spec: {
      rules: [
        {
          backendRefs: [
            { name: 'svc-a', port: 8080 },
            { name: 'svc-b', port: 3000 },
          ],
        },
      ],
    },
  } as unknown as KubernetesObject;

  const ui = helper.getHttpRouteUI(obj);
  expect(ui.backendRefs).toEqual('svc-a:8080, svc-b:3000');
});
