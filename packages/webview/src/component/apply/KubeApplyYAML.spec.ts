/*********************************************************************
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
 ********************************************************************/

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, type RenderResult, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import KubeApplyYAML from './KubeApplyYAML.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import {
  API_CONTEXTS,
  API_SYSTEM,
  type ContextsApi,
  type SystemApi,
  type CurrentContextInfo,
  type AvailableContextsInfo,
} from '@kubernetes-dashboard/channels';

vi.mock(import('tinro'));

// @ts-expect-error runtime-compatible test double with different Svelte bindings type
vi.mock(import('/@/component/editor/MonacoEditor.svelte'), async () => ({
  default: (await import('./MonacoEditorTestDouble.svelte')).default,
}));

const remoteMocks = new RemoteMocks();
const statesMocks = new StatesMocks();
let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  remoteMocks.mock(API_CONTEXTS, {
    createResources: vi.fn(),
    setCurrentContext: vi.fn(),
  } as unknown as ContextsApi);
  remoteMocks.mock(API_SYSTEM, {
    openFileDialog: vi.fn().mockResolvedValue(['kube.yaml']),
    readTextFile: vi.fn().mockResolvedValue('apiVersion: v1\nkind: Pod'),
  } as unknown as SystemApi);

  currentContextMock = new FakeStateObject<CurrentContextInfo, void>();
  availableContextsMock = new FakeStateObject<AvailableContextsInfo, void>();
  currentContextMock.setData({ contextName: 'test-context', namespace: 'default' });
  availableContextsMock.setData({ contextNames: ['test-context', 'other-context'] });

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
});

test(`'Apply' button is visible and disabled after page is opened`, async () => {
  const { getByRole } = render(KubeApplyYAML);
  const button = getByRole('button', { name: 'Apply' });
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
});

test(`'Cancel' button is visible and enabled after page is opened`, async () => {
  const { getByRole } = render(KubeApplyYAML);
  const button = getByRole('button', { name: 'Cancel' });
  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();
});

test(`'Apply' button gets enabled after yaml file is selected`, async () => {
  const { getByRole } = render(KubeApplyYAML);
  const applyButton = getByRole('button', { name: 'Apply' });
  const browseButton = getByRole('button', { name: 'browse' });
  await fireEvent.click(browseButton);
  await vi.waitFor(() => {
    expect(applyButton).toBeEnabled();
  });
});

test(`'Apply' button stay disabled and change to 'Apply Custom YAML' after 'Create custom YAML' option is selected`, async () => {
  const { getByRole } = render(KubeApplyYAML);
  const option = getByRole('button', { name: 'Custom yaml to apply' });
  expect(option).toBeInTheDocument();
  const button = getByRole('button', { name: 'Apply' });
  expect(button).toBeDisabled();
  await fireEvent.click(option);
  expect(button).toHaveAccessibleName('Apply Custom YAML');
  expect(button).toBeDisabled();
});

test(`'Apply Custom YAML' button gets enabled when custom YAML editor content changed and not empty`, async () => {
  const { getByRole } = render(KubeApplyYAML);
  const option = getByRole('button', { name: 'Custom yaml to apply' });
  expect(option).toBeInTheDocument();
  await fireEvent.click(option);
  const button = getByRole('button', { name: 'Apply Custom YAML' });
  const changeContentButton = getByRole('button', { name: 'fireContentChange' });
  await fireEvent.click(changeContentButton);
  expect(button).toBeEnabled();
});

async function applyFileScenario(result: { kind?: string }[] | Error): Promise<RenderResult<typeof KubeApplyYAML>> {
  const applyMock = vi.mocked(remoteMocks.get(API_CONTEXTS).createResources);
  if (result instanceof Error) {
    applyMock.mockRejectedValue(result);
  } else {
    applyMock.mockResolvedValue(result);
  }
  const page = render(KubeApplyYAML);
  const browseButton = page.getByRole('button', { name: 'browse' });
  await fireEvent.click(browseButton);
  await vi.waitFor(() => {
    expect(page.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });
  const applyButton = page.getByRole('button', { name: 'Apply' });
  await fireEvent.click(applyButton);
  return page;
}

test('`Apply` button sends selected file content w/o resources and shows warning message', async () => {
  const { getByText } = await applyFileScenario([]);
  await vi.waitFor(() => {
    expect(getByText('No resource(s) were applied.')).toBeVisible();
  });
});

test('`Apply` button sends selected file content for single resource and shows result message', async () => {
  const { getByText } = await applyFileScenario([{ kind: 'Pod' }]);
  await vi.waitFor(() => {
    expect(getByText('Successfully applied 1 Pod.')).toBeVisible();
  });
});

test('`Apply` button sends selected file content for single unknown resource and shows result message', async () => {
  const { getByText } = await applyFileScenario([{}]);
  await vi.waitFor(() => {
    expect(getByText('Successfully applied 1 unknown resource.')).toBeVisible();
  });
});

test('`Apply` button sends selected file content for multiple resources and shows result message', async () => {
  const { getByText } = await applyFileScenario([{ kind: 'Pod' }, { kind: 'Pod' }, { kind: 'Secret' }]);
  await vi.waitFor(() => {
    expect(getByText('Successfully applied 3 resources (2 Pod, 1 Secret).')).toBeVisible();
  });
});

test('`Apply` button sends selected file content for multiple unknown resources and shows result message', async () => {
  const { getByText } = await applyFileScenario([{}, {}]);
  await vi.waitFor(() => {
    expect(getByText('Successfully applied 2 resources (2 unknown).')).toBeVisible();
  });
});

test('`Apply` button reads file content and calls createResources', async () => {
  await applyFileScenario([{ kind: 'Pod' }]);
  expect(remoteMocks.get(API_SYSTEM).readTextFile).toHaveBeenCalledWith('kube.yaml');
  expect(remoteMocks.get(API_CONTEXTS).createResources).toHaveBeenCalledWith('apiVersion: v1\nkind: Pod');
});

test('`Apply` button sends selected file content and show error message in case of error', async () => {
  const error = new Error('Something went wrong.');
  const { getByText } = await applyFileScenario(error);
  await vi.waitFor(() => {
    const errorMessage = getByText('Could not apply YAML: ' + error);
    expect(errorMessage).toBeVisible();
  });
});

test('`Apply custom YAML` sends custom YAML content to createResources', async () => {
  vi.mocked(remoteMocks.get(API_CONTEXTS).createResources).mockResolvedValue([{ kind: 'Pod' }]);
  const { getByRole } = render(KubeApplyYAML);
  const option = getByRole('button', { name: 'Custom yaml to apply' });
  await fireEvent.click(option);
  const changeContentButton = getByRole('button', { name: 'fireContentChange' });
  await fireEvent.click(changeContentButton);
  const button = getByRole('button', { name: 'Apply Custom YAML' });
  await fireEvent.click(button);
  await vi.waitFor(() => {
    expect(remoteMocks.get(API_CONTEXTS).createResources).toHaveBeenCalledWith('apiVersion: v1\nkind: Pod');
  });
  expect(remoteMocks.get(API_SYSTEM).readTextFile).not.toHaveBeenCalled();
});

test('`Apply custom YAML` shows error message after failed execution', async () => {
  vi.mocked(remoteMocks.get(API_CONTEXTS).createResources).mockRejectedValue(new Error('Failed to apply resources.'));
  const { getByRole, getByText } = render(KubeApplyYAML);
  const option = getByRole('button', { name: 'Custom yaml to apply' });
  await fireEvent.click(option);
  const changeContentButton = getByRole('button', { name: 'fireContentChange' });
  await fireEvent.click(changeContentButton);
  const button = getByRole('button', { name: 'Apply Custom YAML' });
  await fireEvent.click(button);
  await vi.waitFor(() => {
    expect(getByText(/Could not apply YAML/)).toBeVisible();
  });
});

test('Cancel button navigates back to dashboard', async () => {
  const { router } = await import('tinro');
  render(KubeApplyYAML);
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });
  await fireEvent.click(cancelButton);
  expect(router.goto).toHaveBeenCalledWith('/');
});

test('Done button navigates back to dashboard after successful apply', async () => {
  const { router } = await import('tinro');
  await applyFileScenario([{ kind: 'Pod' }]);
  await vi.waitFor(() => {
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
  await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(router.goto).toHaveBeenCalledWith('/');
});

test(`'Apply' button stays disabled when no Kubernetes context is available`, async () => {
  currentContextMock.setData({ contextName: undefined, namespace: undefined });
  availableContextsMock.setData({ contextNames: [] });
  const { getByRole } = render(KubeApplyYAML);
  const browseButton = getByRole('button', { name: 'browse' });
  await fireEvent.click(browseButton);
  await vi.waitFor(() => {
    expect(getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});

test('browse does nothing when dialog is cancelled', async () => {
  vi.mocked(remoteMocks.get(API_SYSTEM).openFileDialog).mockResolvedValue(undefined);
  render(KubeApplyYAML);
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  await fireEvent.click(screen.getByRole('button', { name: 'browse' }));
  expect(applyButton).toBeDisabled();
});
