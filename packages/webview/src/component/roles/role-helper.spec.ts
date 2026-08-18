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

import type { V1Role } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { RoleHelper } from './role-helper';

let helper: RoleHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new RoleHelper();
});

test('expect basic UI conversion', async () => {
  const role: V1Role = {
    metadata: {
      uid: 'role-uid-1',
      name: 'pod-reader',
      namespace: 'default',
      creationTimestamp: new Date('2026-04-10T08:30:00Z'),
    },
    rules: [{ apiGroups: [''], resources: ['pods'], verbs: ['get', 'watch', 'list'] }],
  };

  const result = helper.getRoleUI(role);

  expect(result.kind).toBe('Role');
  expect(result.uid).toBe('role-uid-1');
  expect(result.name).toBe('pod-reader');
  expect(result.namespace).toBe('default');
  expect(result.status).toBe('RUNNING');
  expect(result.selected).toBe(false);
  expect(result.created).toEqual(new Date('2026-04-10T08:30:00Z'));
});

test('expect rules count from rules array length', async () => {
  const role: V1Role = {
    metadata: { uid: 'role-uid-2', name: 'multi-rule-role', namespace: 'staging' },
    rules: [
      { apiGroups: [''], resources: ['pods'], verbs: ['get'] },
      { apiGroups: [''], resources: ['configmaps'], verbs: ['get', 'list'] },
    ],
  };

  const result = helper.getRoleUI(role);

  expect(result.rules).toBe(2);
});

test('expect rules count zero when no rules', async () => {
  const role: V1Role = {
    metadata: { uid: 'role-uid-3', name: 'empty-role', namespace: 'default' },
  };

  const result = helper.getRoleUI(role);

  expect(result.rules).toBe(0);
});
