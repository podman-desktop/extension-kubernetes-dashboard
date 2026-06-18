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
import { ScaleEditorState } from '/@/component/deployments/scale-editor-state.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
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

test('shows the scale action button before editing', () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(false);
  render(ScaleAction, { object: fakeDeployment });

  expect(screen.getByRole('button', { name: 'Scale Deployment' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Desired replica count for my-deployment')).toBeNull();
});

test('shows the inline number input after clicking scale', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  expect(input).toHaveValue('3');
  expect(screen.getByRole('button', { name: 'Cancel scaling Deployment' })).toBeInTheDocument();
});

test('shows cancel button instead of scale button while editing in button mode', () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment, mode: 'button' });

  expect(screen.queryByRole('button', { name: 'Scale Deployment' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Cancel scaling Deployment' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Desired replica count for my-deployment')).toBeNull();
});

test('shows the apply button only after the value changes', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  expect(screen.getByRole('button', { name: 'Apply scale for Deployment' })).toBeDisabled();

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '5' } });

  expect(screen.getByRole('button', { name: 'Apply scale for Deployment' })).toBeEnabled();
});

test('calls scaleObject with the changed replica count and returns to the scale button', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '5' } });
  await fireEvent.click(screen.getByRole('button', { name: 'Apply scale for Deployment' }));

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).toHaveBeenCalledWith('Deployment', 'my-deployment', 'ns1', 5);
  expect(dependencyMocks.get(ScaleEditorState).stopEditing).toHaveBeenCalled();
});

test('cancel dismisses inline editing without scaling', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '4' } });
  await fireEvent.click(screen.getByRole('button', { name: 'Cancel scaling Deployment' }));

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).not.toHaveBeenCalled();
  expect(dependencyMocks.get(ScaleEditorState).stopEditing).toHaveBeenCalled();
});

test('escape dismisses inline editing without scaling', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.keyDown(input, { key: 'Escape' });

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).not.toHaveBeenCalled();
  expect(dependencyMocks.get(ScaleEditorState).stopEditing).toHaveBeenCalled();
});

test('enter scales with the changed replica count', async () => {
  dependencyMocks.get(ScaleEditorState).isEditing = vi.fn().mockReturnValue(true);
  render(ScaleAction, { object: fakeDeployment });

  const input = screen.getByLabelText('Desired replica count for my-deployment');
  await fireEvent.input(input, { target: { value: '4' } });
  await fireEvent.keyDown(input, { key: 'Enter' });

  expect(remoteMocks.get(API_CONTEXTS).scaleObject).toHaveBeenCalledWith('Deployment', 'my-deployment', 'ns1', 4);
});
