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

import type { V1IngressClass } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { IngressClassHelper } from './ingress-class-helper';

let helper: IngressClassHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new IngressClassHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'nginx',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: {
      controller: 'k8s.io/ingress-nginx',
    },
  } as unknown as V1IngressClass;

  const ui = helper.getIngressClassUI(obj);
  expect(ui.kind).toEqual('IngressClass');
  expect(ui.name).toEqual('nginx');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.controller).toEqual('k8s.io/ingress-nginx');
});

test('expect isDefault true when annotation is true', async () => {
  const obj = {
    metadata: {
      name: 'nginx',
      annotations: {
        'ingressclass.kubernetes.io/is-default-class': 'true',
      },
    },
    spec: { controller: 'k8s.io/ingress-nginx' },
  } as unknown as V1IngressClass;

  const ui = helper.getIngressClassUI(obj);
  expect(ui.isDefault).toEqual('true');
});

test('expect isDefault false when annotation is missing', async () => {
  const obj = {
    metadata: { name: 'nginx' },
    spec: { controller: 'k8s.io/ingress-nginx' },
  } as unknown as V1IngressClass;

  const ui = helper.getIngressClassUI(obj);
  expect(ui.isDefault).toEqual('false');
});
