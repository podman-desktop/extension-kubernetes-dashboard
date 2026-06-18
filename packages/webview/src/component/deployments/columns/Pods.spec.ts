/**********************************************************************
 * Copyright (C) 2023-2025 Red Hat, Inc.
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

import { API_CONTEXTS, type ContextsApi } from '@kubernetes-dashboard/channels';
import type { DeploymentUI } from '/@/component/deployments/DeploymentUI';
import { ScaleEditorState } from '/@/component/deployments/scale-editor-state.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { RemoteMocks } from '/@/tests/remote-mocks';

import Pods from './Pods.svelte';

const dependencyMocks = new DependencyMocks();
const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(ScaleEditorState);

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    scaleObject: vi.fn(),
  } as unknown as ContextsApi);
});

test('Expect simple column styling', async () => {
  const deployment: DeploymentUI = {
    uid: '123',
    name: 'my-deployment',
    kind: 'Deployment',
    status: '',
    namespace: '',
    replicas: 0,
    ready: 0,
    selected: false,
    conditions: [],
  };
  render(Pods, { object: deployment });

  const text = screen.getByText(deployment.ready + ' / ' + deployment.replicas);
  expect(text).toBeInTheDocument();
  expect(text.parentElement).toHaveClass('text-(--pd-table-body-text)');
  expect(screen.queryByRole('button', { name: 'Scale Deployment' })).toBeNull();
});

test('Expect scale editor to render in pods column while editing', () => {
  const deployment: DeploymentUI = {
    uid: '123',
    name: 'my-deployment',
    kind: 'Deployment',
    status: '',
    namespace: 'ns1',
    replicas: 1,
    ready: 1,
    selected: false,
    conditions: [],
  };
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);

  render(Pods, { object: deployment });

  expect(screen.getByLabelText('Desired replica count for my-deployment')).toBeInTheDocument();
  expect(screen.queryByText(deployment.ready + ' / ' + deployment.replicas)).toBeNull();
});
