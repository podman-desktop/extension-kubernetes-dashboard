/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import DeleteAction from './DeleteAction.svelte';
import type { ConfigMapSecretUI } from '/@/component/configmaps-secrets/ConfigMapSecretUI';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_CONTEXTS } from '/@common/index';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { KubernetesObjectUIHelper } from '../kubernetes-object-ui-helper';
import type { NamespaceUI } from '../../namespaces/NamespaceUI';
import type { ContextsApi } from '/@common/interface/contexts-api';

const fakeConfigMap: ConfigMapSecretUI = {
  kind: 'ConfigMap',
  name: 'my-configmap',
  namespace: 'ns1',
  selected: false,
  type: 'ConfigMap',
  status: '',
  keys: [],
};

const fakeSecret: ConfigMapSecretUI = {
  kind: 'Secret',
  name: 'my-secret',
  namespace: 'ns1',
  selected: false,
  type: 'Secret',
  status: '',
  keys: [],
};

const fakeNamespace: NamespaceUI = {
  kind: 'Namespace',
  name: 'my-namespace',
  status: '',
};

const dependencyMocks = new DependencyMocks();

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(KubernetesObjectUIHelper);

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    deleteObject: vi.fn(),
  } as unknown as ContextsApi);
});

test('Expect no error when deleting configmap', async () => {
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).isNamespaced).mockReturnValue(true);
  render(DeleteAction, { object: fakeConfigMap });

  // click on delete button
  const deleteButton = screen.getByRole('button', { name: 'Delete ConfigMap' });
  await fireEvent.click(deleteButton);

  // wait for the delete function to be called
  expect(remoteMocks.get(API_CONTEXTS).deleteObject).toHaveBeenCalledWith('ConfigMap', 'my-configmap', 'ns1');
});

test('Expect no error when deleting secret', async () => {
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).isNamespaced).mockReturnValue(true);
  render(DeleteAction, { object: fakeSecret });

  // click on delete button
  const deleteButton = screen.getByRole('button', { name: 'Delete Secret' });
  await fireEvent.click(deleteButton);

  // wait for the delete function to be called
  expect(remoteMocks.get(API_CONTEXTS).deleteObject).toHaveBeenCalledWith('Secret', 'my-secret', 'ns1');
});

test('Expect no error when deleting namespace', async () => {
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).isNamespaced).mockReturnValue(false);
  render(DeleteAction, { object: fakeNamespace });

  // click on delete button
  const deleteButton = screen.getByRole('button', { name: 'Delete Namespace' });
  await fireEvent.click(deleteButton);

  // wait for the delete function to be called
  expect(remoteMocks.get(API_CONTEXTS).deleteObject).toHaveBeenCalledWith('Namespace', 'my-namespace');
});
