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

import { render, screen, within } from '@testing-library/svelte';
import PodTerminalBrowser from './PodTerminalBrowser.svelte';
import type { V1Pod } from '@kubernetes/client-node';
import PodTerminal from './PodTerminal.svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

vi.mock(import('./PodTerminal.svelte'));

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

test('renders with no container running', () => {
  render(PodTerminalBrowser, { object: fakePodNoContainerRunning });
  screen.getByText('No container running');
});

test('renders with 2 containers running', async () => {
  render(PodTerminalBrowser, { object: fakePod2containersRunning });
  const dropdown = screen.getByLabelText('Select container');
  const dropdownButton = within(dropdown).getByText('container1');
  expect(vi.mocked(PodTerminal)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container1',
  });
  await userEvent.click(dropdownButton);
  const container2 = within(dropdown).getByText('container2');
  await userEvent.click(container2);
  expect(vi.mocked(PodTerminal)).toHaveBeenCalledWith(expect.anything(), {
    object: fakePod2containersRunning,
    containerName: 'container2',
  });
});

test('renders with 1 container running', () => {
  render(PodTerminalBrowser, { object: fakePod1containerRunning });
  expect(screen.queryByText('container1')).not.toBeInTheDocument();
});
