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

import type { V1ClusterRoleBinding } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ClusterRoleBindingHelper } from './cluster-role-binding-helper';

let helper: ClusterRoleBindingHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new ClusterRoleBindingHelper();
});

test('expect basic UI conversion', async () => {
  const crb: V1ClusterRoleBinding = {
    metadata: {
      uid: 'crb-uid-1',
      name: 'admin-binding',
      creationTimestamp: new Date('2026-05-01T14:00:00Z'),
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'cluster-admin',
    },
    subjects: [{ kind: 'User', name: 'alice', apiGroup: 'rbac.authorization.k8s.io' }],
  };

  const result = helper.getClusterRoleBindingUI(crb);

  expect(result.kind).toBe('ClusterRoleBinding');
  expect(result.uid).toBe('crb-uid-1');
  expect(result.name).toBe('admin-binding');
  expect(result.status).toBe('RUNNING');
  expect(result.created).toEqual(new Date('2026-05-01T14:00:00Z'));
});

test('expect bindings joined from subjects names', async () => {
  const crb: V1ClusterRoleBinding = {
    metadata: { uid: 'crb-uid-2', name: 'multi-binding' },
    roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: 'view' },
    subjects: [
      { kind: 'User', name: 'alice', apiGroup: 'rbac.authorization.k8s.io' },
      { kind: 'User', name: 'bob', apiGroup: 'rbac.authorization.k8s.io' },
      { kind: 'ServiceAccount', name: 'deployer', apiGroup: '' },
    ],
  };

  const result = helper.getClusterRoleBindingUI(crb);

  expect(result.bindings).toBe('alice, bob, deployer');
});

test('expect role from roleRef name', async () => {
  const crb: V1ClusterRoleBinding = {
    metadata: { uid: 'crb-uid-3', name: 'editor-binding' },
    roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: 'edit' },
  };

  const result = helper.getClusterRoleBindingUI(crb);

  expect(result.role).toBe('edit');
  expect(result.bindings).toBe('');
});
