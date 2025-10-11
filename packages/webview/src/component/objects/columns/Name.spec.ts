/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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

import KubernetesColumnName from './Name.svelte';
import type { KubernetesNamespacedObjectUI, KubernetesObjectUI } from '/@/component/objects/KubernetesObjectUI';
import { Navigator } from '/@/navigation/navigator';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';
import { DependencyMocks } from '/@/tests/dependency-mocks';

const node: KubernetesObjectUI = {
  kind: 'Node',
  name: 'my-node',
  status: '',
};

const deployment: KubernetesNamespacedObjectUI = {
  kind: 'Deployment',
  name: 'my-deployment',
  status: '',
  namespace: 'default',
  selected: false,
};

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();
  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);
  dependencyMocks.mock(KubernetesObjectUIHelper);
});

test('Expect simple column styling', async () => {
  render(KubernetesColumnName, { object: node });

  const name = screen.getByText(node.name);
  expect(name).toBeInTheDocument();
  expect(name).toHaveClass('text-[var(--pd-table-body-text-highlight)]');
  expect(name).toHaveClass('overflow-hidden');
  expect(name).toHaveClass('text-ellipsis');

  expect(name.parentElement).toHaveClass('text-left');
});

test('Expect namespaced column styling', async () => {
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).isNamespaced).mockReturnValue(true);
  render(KubernetesColumnName, { object: deployment });

  const name = screen.getByText(deployment.name);
  expect(name).toBeInTheDocument();
  expect(name).toHaveClass('text-[var(--pd-table-body-text-highlight)]');
  expect(name).toHaveClass('overflow-hidden');
  expect(name).toHaveClass('text-ellipsis');

  expect(name.parentElement).toHaveClass('text-left');

  const namespace = screen.getByText(deployment.namespace);
  expect(namespace).toBeInTheDocument();
  expect(namespace).toHaveClass('text-[var(--pd-table-body-text)]');
  expect(namespace).toHaveClass('overflow-hidden');
  expect(namespace).toHaveClass('text-ellipsis');
});

test('Expect clicking works', async () => {
  render(KubernetesColumnName, {
    object: node,
  });

  const name = screen.getByText(node.name);
  expect(name).toBeInTheDocument();

  await fireEvent.click(name);

  expect(dependencyMocks.get(Navigator).navigateTo).toHaveBeenCalledWith({ kind: node.kind, name: node.name });
});

test('Expect namespaced clicking works', async () => {
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).isNamespaced).mockReturnValue(true);
  render(KubernetesColumnName, {
    object: deployment,
  });

  const name = screen.getByText(deployment.name);
  expect(name).toBeInTheDocument();

  await fireEvent.click(name);

  expect(dependencyMocks.get(Navigator).navigateTo).toHaveBeenCalledWith({
    kind: deployment.kind,
    name: deployment.name,
    namespace: deployment.namespace,
  });
});
