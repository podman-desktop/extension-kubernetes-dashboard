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
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
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

const fakePodSingleContainerRunning: V1Pod = {
  status: {
    containerStatuses: [{ name: 'container1', state: { running: {} } }],
  },
} as V1Pod;

const fakePodOneRunningOneTerminated: V1Pod = {
  status: {
    containerStatuses: [
      { name: 'container1', state: { running: {} } },
      { name: 'container2', state: { terminated: {} } },
    ],
  },
} as V1Pod;

// Simulates a pod whose container(s) crashed: no container is running anymore, but their
// previous logs should still be reachable through the toolbar.
const fakePodAllContainersTerminated: V1Pod = {
  status: {
    containerStatuses: [
      { name: 'container1', state: { terminated: {} } },
      { name: 'container2', state: { terminated: {} } },
    ],
  },
} as V1Pod;

const fakePodNoContainerStatus: V1Pod = {
  status: {},
} as V1Pod;

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  dependencyMocks.reset();
  dependencyMocks.mock(PodLogsHelper);
  vi.mocked(dependencyMocks.get(PodLogsHelper).getColorizers).mockReturnValue(['colorizer 1', 'colorizer 2']);
  dependencyMocks.mock(Annotations);
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

test('renders empty screen when pod has no container status', () => {
  render(PodLogsCustomizable, { object: fakePodNoContainerStatus });
  expect(screen.getByText('No container found')).toBeDefined();
});

test('still renders toolbar and logs when all containers are terminated, so previous logs remain accessible', async () => {
  render(PodLogsCustomizable, { object: fakePodAllContainersTerminated });
  expect(screen.queryByText('No container found')).not.toBeInTheDocument();

  const containerDropdown = screen.getByLabelText('Select container');
  within(containerDropdown).getByText('All containers');
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodAllContainersTerminated,
    containerName: '',
    colorizer: 'colorizer 1',
    timestamps: false,
    previous: false,
  });

  // Containers that are not running are still selectable and flagged as such
  await userEvent.click(within(containerDropdown).getByText('All containers'));
  within(containerDropdown).getByText('container1 (not running)');
  const container2Option = within(containerDropdown).getByText('container2 (not running)');
  await userEvent.click(container2Option);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodAllContainersTerminated,
    containerName: 'container2',
    colorizer: 'colorizer 1',
    timestamps: false,
    previous: false,
  });

  // Previous logs can still be requested for the crashed container
  const previousCheckbox = screen.getByLabelText('Previous logs');
  await userEvent.click(previousCheckbox);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodAllContainersTerminated,
    containerName: 'container2',
    colorizer: 'colorizer 1',
    timestamps: false,
    previous: true,
  });
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
    timestamps: false,
    previous: false,
    follow: true,
  });

  await userEvent.click(containerDropdownButton);
  const container2 = within(containerDropdown).getByText('container2');
  await userEvent.click(container2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 1',
    timestamps: false,
    previous: false,
    follow: true,
  });

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: false,
    follow: true,
  });

  const previousCheckbox = screen.getByLabelText('Previous logs');
  await userEvent.click(previousCheckbox);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: true,
    follow: true,
  });

  // Tail lines waits for 1 second before dispatching the new value
  const tailLinesInput = screen.getByLabelText('Last lines');
  vi.mocked(PodLogs).mockClear();
  await userEvent.type(tailLinesInput, '1');
  await vi.advanceTimersByTimeAsync(100);
  await userEvent.type(tailLinesInput, '0');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(PodLogs).toHaveBeenCalledOnce();
  expect(PodLogs).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: true,
    follow: true,
    tailLines: '10',
  });

  // Since seconds waits for 1 second before dispatching the new value
  const sinceSecondsInput = screen.getByLabelText('Last seconds');
  vi.mocked(PodLogs).mockClear();
  await userEvent.type(sinceSecondsInput, '3');
  await vi.advanceTimersByTimeAsync(100);
  await userEvent.type(sinceSecondsInput, '5');
  await vi.advanceTimersByTimeAsync(1_000);
  expect(PodLogs).toHaveBeenCalledOnce();
  expect(PodLogs).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: true,
    follow: true,
    tailLines: '10',
    sinceSeconds: '35',
  });

  // Stream logs checkbox is checked by default and disables follow when unchecked
  const followCheckbox = screen.getByLabelText('Stream logs');
  expect(followCheckbox).toBeChecked();
  vi.mocked(PodLogs).mockClear();
  await userEvent.click(followCheckbox);
  expect(followCheckbox).not.toBeChecked();
  expect(PodLogs).toHaveBeenCalledOnce();
  expect(PodLogs).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: true,
    follow: false,
    tailLines: '10',
    sinceSeconds: '35',
  });
});

test('renders with one running and one terminated container, terminated container flagged as not running', async () => {
  render(PodLogsCustomizable, { object: fakePodOneRunningOneTerminated });
  const containerDropdown = screen.getByLabelText('Select container');

  await userEvent.click(within(containerDropdown).getByText('All containers'));
  within(containerDropdown).getByText('container1');
  within(containerDropdown).getByText('container2 (not running)');

  const container2 = within(containerDropdown).getByText('container2 (not running)');
  await userEvent.click(container2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodOneRunningOneTerminated,
    containerName: 'container2',
    colorizer: 'colorizer 1',
    timestamps: false,
    previous: false,
  });
});

test('renders with 1 container running', async () => {
  render(PodLogsCustomizable, { object: fakePodSingleContainerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();

  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodSingleContainerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: false,
    follow: true,
  });
});

test('renders with 1 container running with colors annotation', async () => {
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({ 'logs-colors': 'colorizer 2' });
  vi.mocked(dependencyMocks.get(PodLogsHelper).resolveColorizer).mockImplementation(s => s ?? 'colorizer 1');

  render(PodLogsCustomizable, { object: fakePodSingleContainerRunning });

  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodSingleContainerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: false,
    follow: true,
  });
});

test('renders with 1 container running with timestamps annotation', async () => {
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({ 'logs-timestamps': 'true' });

  render(PodLogsCustomizable, { object: fakePodSingleContainerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();

  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodSingleContainerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
    timestamps: true,
    previous: false,
    follow: true,
  });
});

test('renders with 1 container running with tailLines annotation', async () => {
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({ 'logs-tail-lines': '10' });

  render(PodLogsCustomizable, { object: fakePodSingleContainerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();

  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodSingleContainerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: false,
    follow: true,
    tailLines: '10',
  });
});

test('renders with 1 container running with sinceSeconds annotation', async () => {
  vi.mocked(dependencyMocks.get(Annotations).getAnnotations).mockReturnValue({ 'logs-since-seconds': '35' });

  render(PodLogsCustomizable, { object: fakePodSingleContainerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();

  const colorizerDropdown = screen.getByLabelText('Select colorization');
  const colorizerDropdownButton = within(colorizerDropdown).getByText('colorizer 1');

  await userEvent.click(colorizerDropdownButton);
  const colorizer2 = within(colorizerDropdown).getByText('colorizer 2');
  await userEvent.click(colorizer2);
  expect(vi.mocked(PodLogs)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePodSingleContainerRunning,
    containerName: '',
    colorizer: 'colorizer 2',
    timestamps: false,
    previous: false,
    follow: true,
    sinceSeconds: '35',
  });
});
