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
import { ScaleEditorController } from '/@/component/deployments/scale-editor-controller';
import type { ScaleEditorInfo } from '/@/state/scale-editor.svelte';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { StatesMocks } from '/@/tests/state-mocks';

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

const dependencyMocks = new DependencyMocks();
const remoteMocks = new RemoteMocks();
const statesMocks = new StatesMocks();
let scaleEditorMock: FakeStateObject<ScaleEditorInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(ScaleEditorController);

  statesMocks.reset();
  scaleEditorMock = new FakeStateObject<ScaleEditorInfo, void>();
  statesMocks.mock<ScaleEditorInfo, void>('stateScaleEditorInfoUI', scaleEditorMock);

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    scaleObject: vi.fn(),
  } as unknown as ContextsApi);
});

test('shows the scale action button before editing', () => {
  // No active editor state for this deployment.
  render(ScaleAction, { object: fakeDeployment });

  expect(screen.getByRole('button', { name: 'Scale Deployment' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Desired replica count for my-deployment')).toBeNull();
});

test('shows the inline number input after clicking scale', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  expect(input).toHaveValue('3');
  expect(screen.queryByRole('button', { name: 'Cancel scaling Deployment' })).toBeNull();
});

test('shows cancel button instead of scale button while editing in button mode', () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'button' });

  expect(screen.queryByRole('button', { name: 'Scale Deployment' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Cancel scaling Deployment' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Desired replica count for my-deployment')).toBeNull();
});

test('shows the apply button only after the value changes', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  expect(screen.getByRole('button', { name: 'Apply scale for Deployment' })).toBeDisabled();

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '5' } });

  expect(screen.getByRole('button', { name: 'Apply scale for Deployment' })).toBeEnabled();
});

test('calls scaleObject with the changed replica count and returns to the scale button', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '5' } });
  await fireEvent.click(screen.getByRole('button', { name: 'Apply scale for Deployment' }));

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).toHaveBeenCalledWith('Deployment', 'my-deployment', 'ns1', 5);
  expect(dependencyMocks.get(ScaleEditorController).stopEditing).toHaveBeenCalled();
});

test('cancel dismisses inline editing without scaling', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '4' } });
  await fireEvent.keyDown(input, { key: 'Escape' });

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).not.toHaveBeenCalled();
  expect(dependencyMocks.get(ScaleEditorController).stopEditing).toHaveBeenCalled();
});

test('escape dismisses inline editing without scaling', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.keyDown(input, { key: 'Escape' });

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).not.toHaveBeenCalled();
  expect(dependencyMocks.get(ScaleEditorController).stopEditing).toHaveBeenCalled();
});

test('enter scales with the changed replica count', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '4' } });
  await fireEvent.keyDown(input, { key: 'Enter' });

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).toHaveBeenCalledWith('Deployment', 'my-deployment', 'ns1', 4);
});

test('enter on the apply button only scales once', async () => {
  scaleEditorMock.setData({ deploymentKey: 'ns1/my-deployment' });
  render(ScaleAction, { object: fakeDeployment, mode: 'editor' });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '4' } });

  const applyButton = screen.getByRole('button', { name: 'Apply scale for Deployment' });
  await fireEvent.keyDown(applyButton, { key: 'Enter' });
  await fireEvent.click(applyButton);

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).toHaveBeenCalledTimes(1);
});
