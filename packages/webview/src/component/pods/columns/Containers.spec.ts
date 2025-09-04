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

import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import Containers from './Containers.svelte';
import type { PodUI } from '/@/component/pods/PodUI';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

const pod: PodUI = {
  kind: 'Pod',
  name: '',
  status: '',
  selected: false,
  containers: [
    {
      Id: 'container1',
      Names: 'container1',
      Status: 'RUNNING',
    },
  ],
  namespace: '',
};

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();
  dependencyMocks.reset();
  dependencyMocks.mock(KubernetesObjectUIHelper);
});

test('Expect simple column styling', async () => {
  render(Containers, { object: pod });

  const dot = screen.getByTestId('status-dot');
  expect(dot).toBeInTheDocument();
  expect(dot).toHaveClass('bg-[var(--pd-status-running)]');
});
