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

import { render, screen, within } from '@testing-library/svelte';
import type { V1Pod } from '@kubernetes/client-node';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import PodLogsCustomizable from '/@/component/pods/PodLogsCustomizable.svelte';
import PodLogs from '/@/component/pods/PodLogs.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { PodLogsHelper } from '/@/component/pods/pod-logs-helper';
import { Annotations } from '/@/annotations/annotations';

vi.mock(import('./PodLogs.svelte'));

const fakePod2containersRunning: V1Pod = {
  status: {
    containerStatuses: [
      { name: 'container1', state: { running: {} } },
      { name: 'container2', state: { running: {} } },
    ],
  },
} as V1Pod;

const fakePod1containerRunning: V1Pod = {
  status: {
    containerStatuses: [
      { name: 'container1', state: { running: {} } },
      { name: 'container2', state: { terminated: {} } },
    ],
  },
} as V1Pod;

const fakePodNoContainerRunning: V1Pod = {
  status: {
    containerStatuses: [
      { name: 'container1', state: { terminated: {} } },
      { name: 'container2', state: { terminated: {} } },
    ],
  },
} as V1Pod;

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();
  dependencyMocks.reset();
  dependencyMocks.mock(PodLogsHelper);
  vi.mocked(dependencyMocks.get(PodLogsHelper).getColorizers).mockReturnValue(['colorizer 1', 'colorizer 2']);
  dependencyMocks.mock(Annotations);
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({});
});

test('renders with no container running', () => {
  render(PodLogsCustomizable, { object: fakePodNoContainerRunning });
  expect(screen.getByText('No container running')).toBeDefined();
});

test('renders with 2 containers running', async () => {
  render(PodLogsCustomizable, { object: fakePod2containersRunning });
  const containerDropdown = screen.getByLabelText('Select container');
  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const containerDropdownButton = within(containerDropdown).getByText('All containers');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: '',
    colorizer: 'colorizer 1',
  });

  await userEvent.click(containerDropdownButton);
  const container2 = within(containerDropdown).getByText('container2');
  await userEvent.click(container2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 1',
  });

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
  });
});

test('renders with 1 container running', async () => {
  render(PodLogsCustomizable, { object: fakePod1containerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();

  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod1containerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
  });
});

test('renders with 1 container running with colors annotation', async () => {
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({ 'logs-colors': 'colorizer 2' });
  vi.mocked(dependencyMocks.get(PodLogsHelper).resolveColorizer).mockImplementation(s => s ?? 'colorizer 1');

  render(PodLogsCustomizable, { object: fakePod1containerRunning });

  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod1containerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
  });
});
