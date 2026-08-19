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

import type { V1ClusterRole } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ClusterRoleHelper } from './cluster-role-helper';

let helper: ClusterRoleHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new ClusterRoleHelper();
});

test('expect basic UI conversion', async () => {
  const cr: V1ClusterRole = {
    metadata: {
      uid: 'cr-uid-1',
      name: 'cluster-admin',
      creationTimestamp: new Date('2026-02-20T12:00:00Z'),
    },
    rules: [
      { apiGroups: ['*'], resources: ['*'], verbs: ['*'] },
      { apiGroups: [''], resources: ['pods'], verbs: ['get', 'list'] },
    ],
  };

  const result = helper.getClusterRoleUI(cr);

  expect(result.kind).toBe('ClusterRole');
  expect(result.uid).toBe('cr-uid-1');
  expect(result.name).toBe('cluster-admin');
  expect(result.status).toBe('RUNNING');
  expect(result.created).toEqual(new Date('2026-02-20T12:00:00Z'));
});

test('expect rules count from rules array length', async () => {
  const cr: V1ClusterRole = {
    metadata: { uid: 'cr-uid-2', name: 'role-with-rules' },
    rules: [
      { apiGroups: [''], resources: ['pods'], verbs: ['get'] },
      { apiGroups: [''], resources: ['services'], verbs: ['list'] },
      { apiGroups: ['apps'], resources: ['deployments'], verbs: ['create'] },
    ],
  };

  const result = helper.getClusterRoleUI(cr);

  expect(result.rules).toBe(3);
});

test('expect rules count zero when no rules', async () => {
  const cr: V1ClusterRole = {
    metadata: { uid: 'cr-uid-3', name: 'role-no-rules' },
  };

  const result = helper.getClusterRoleUI(cr);

  expect(result.rules).toBe(0);
});
