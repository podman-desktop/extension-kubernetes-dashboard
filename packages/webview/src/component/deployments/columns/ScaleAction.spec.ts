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

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import { API_CONTEXTS, type ContextsApi } from '@kubernetes-dashboard/channels';
import type { DeploymentUI } from '/@/component/deployments/DeploymentUI';
import { RemoteMocks } from '/@/tests/remote-mocks';

import ScaleAction from './ScaleAction.svelte';

const fakeDeployment: DeploymentUI = {
  kind: 'Deployment',
  uid: 'uid',
  name: 'my-deployment',
  namespace: 'ns1',
  selected: false,
  status: 'RUNNING',
  replicas: 3,
  ready: 3,
  conditions: [],
};

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    scaleDeployment: vi.fn(),
  } as unknown as ContextsApi);
});

test('Expect no error when scaling deployment', async () => {
  render(ScaleAction, { object: fakeDeployment });

  const scaleButton = screen.getByRole('button', { name: 'Scale Deployment' });
  await fireEvent.click(scaleButton);

  expect(remoteMocks.get(API_CONTEXTS).scaleDeployment).toHaveBeenCalledWith('my-deployment', 'ns1', 3);
});
