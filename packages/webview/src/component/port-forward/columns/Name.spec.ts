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

import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import NameColumn from './Name.svelte';
import { WorkloadKind, type PortMapping } from '@kubernetes-dashboard/channels';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { Navigator } from '/@/navigation/navigator';

const DUMMY_MAPPING: PortMapping = {
  localPort: 55_501,
  remotePort: 80,
};

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);
});

test('name should be visible', () => {
  const { getByText } = render(NameColumn, {
    object: {
      id: 'dummy-id',
      name: 'dummy-pod-name',
      namespace: 'dummy-ns',
      kind: WorkloadKind.POD,
      forward: DUMMY_MAPPING,
    },
  });

  const div = getByText('dummy-pod-name');
  expect(div).toBeDefined();
});

test('click on name should redirect to pod page', async () => {
  const { getByTitle } = render(NameColumn, {
    object: {
      id: 'dummy-id',
      name: 'dummy-pod-name',
      namespace: 'dummy-ns',
      kind: WorkloadKind.POD,
      forward: DUMMY_MAPPING,
    },
  });

  const openBtn = getByTitle('Open pod details');
  expect(openBtn).toBeDefined();

  await fireEvent.click(openBtn);

  expect(dependencyMocks.get(Navigator).navigateTo).toHaveBeenCalledWith({
    kind: 'Pod',
    name: 'dummy-pod-name',
    namespace: 'dummy-ns',
  });
});
