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

import type { V1RoleBinding } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { RoleBindingHelper } from './role-binding-helper';

let helper: RoleBindingHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new RoleBindingHelper();
});

test('expect basic UI conversion', async () => {
  const rb: V1RoleBinding = {
    metadata: {
      uid: 'rb-uid-1',
      name: 'dev-binding',
      namespace: 'development',
      creationTimestamp: new Date('2026-06-15T09:00:00Z'),
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Role',
      name: 'pod-reader',
    },
    subjects: [{ kind: 'User', name: 'dev-user', apiGroup: 'rbac.authorization.k8s.io' }],
  };

  const result = helper.getRoleBindingUI(rb);

  expect(result.kind).toBe('RoleBinding');
  expect(result.uid).toBe('rb-uid-1');
  expect(result.name).toBe('dev-binding');
  expect(result.namespace).toBe('development');
  expect(result.status).toBe('RUNNING');
  expect(result.selected).toBe(false);
  expect(result.created).toEqual(new Date('2026-06-15T09:00:00Z'));
});

test('expect bindings joined from subjects names', async () => {
  const rb: V1RoleBinding = {
    metadata: { uid: 'rb-uid-2', name: 'team-binding', namespace: 'prod' },
    roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'editor' },
    subjects: [
      { kind: 'User', name: 'carol', apiGroup: 'rbac.authorization.k8s.io' },
      { kind: 'Group', name: 'developers', apiGroup: 'rbac.authorization.k8s.io' },
    ],
  };

  const result = helper.getRoleBindingUI(rb);

  expect(result.bindings).toBe('carol, developers');
});

test('expect role from roleRef name', async () => {
  const rb: V1RoleBinding = {
    metadata: { uid: 'rb-uid-3', name: 'viewer-binding', namespace: 'default' },
    roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'view' },
  };

  const result = helper.getRoleBindingUI(rb);

  expect(result.role).toBe('view');
  expect(result.bindings).toBe('');
});
