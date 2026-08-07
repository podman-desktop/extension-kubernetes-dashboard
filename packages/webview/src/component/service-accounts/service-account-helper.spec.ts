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

import type { V1ServiceAccount } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ServiceAccountHelper } from './service-account-helper';

let helper: ServiceAccountHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new ServiceAccountHelper();
});

test('expect basic UI conversion', async () => {
  const sa: V1ServiceAccount = {
    metadata: {
      uid: 'sa-uid-1',
      name: 'my-service-account',
      namespace: 'kube-system',
      creationTimestamp: new Date('2026-03-15T10:00:00Z'),
    },
    secrets: [{ name: 'secret-1' }, { name: 'secret-2' }],
  };

  const result = helper.getServiceAccountUI(sa);

  expect(result.kind).toBe('ServiceAccount');
  expect(result.uid).toBe('sa-uid-1');
  expect(result.name).toBe('my-service-account');
  expect(result.namespace).toBe('kube-system');
  expect(result.status).toBe('RUNNING');
  expect(result.selected).toBe(false);
  expect(result.created).toEqual(new Date('2026-03-15T10:00:00Z'));
});

test('expect secrets count from secrets array length', async () => {
  const sa: V1ServiceAccount = {
    metadata: { uid: 'sa-uid-2', name: 'sa-with-secrets' },
    secrets: [{ name: 'secret-a' }, { name: 'secret-b' }, { name: 'secret-c' }],
  };

  const result = helper.getServiceAccountUI(sa);

  expect(result.secrets).toBe(3);
});

test('expect secrets count zero when no secrets', async () => {
  const sa: V1ServiceAccount = {
    metadata: { uid: 'sa-uid-3', name: 'sa-no-secrets' },
  };

  const result = helper.getServiceAccountUI(sa);

  expect(result.secrets).toBe(0);
});
