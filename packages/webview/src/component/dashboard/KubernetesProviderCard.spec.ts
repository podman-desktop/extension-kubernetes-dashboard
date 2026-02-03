/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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
import KubernetesProviderCard from '/@/component/dashboard/KubernetesProviderCard.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_NAVIGATION, API_TELEMETRY } from '@kubernetes-dashboard/channels';
import type { NavigationApi, TelemetryApi } from '@kubernetes-dashboard/channels';
import userEvent from '@testing-library/user-event';

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  remoteMocks.reset();

  remoteMocks.mock(API_NAVIGATION, {
    navigateToProviderNewConnection: vi.fn(),
  } as unknown as NavigationApi);
  remoteMocks.mock(API_TELEMETRY, {
    track: vi.fn().mockResolvedValue(undefined),
  } as unknown as TelemetryApi);
});

test('should render with all values passed', async () => {
  render(KubernetesProviderCard, {
    provider: {
      id: 'k8s-provider',
      creationDisplayName: 'Kubernetes Provider',
      creationButtonTitle: 'Create Kubernetes Provider',
      emptyConnectionMarkdownDescription: 'Create a new Kubernetes Provider',
    },
  });
  screen.getByText('Kubernetes Provider');
  screen.getByText('Create Kubernetes Provider');
  const btn = screen.getByRole('button', { name: 'Create Kubernetes Provider' });
  expect(btn).toBeEnabled();
  await userEvent.click(btn);
  expect(remoteMocks.get(API_NAVIGATION).navigateToProviderNewConnection).toHaveBeenCalledWith('k8s-provider');
});

test('should render with minimal values passed', async () => {
  render(KubernetesProviderCard, {
    provider: {
      id: 'k8s-provider',
    },
  });
  screen.getByText('Create');
  screen.getByText('Create new');
  const btn = screen.getByRole('button', { name: 'Create new' });
  expect(btn).toBeEnabled();
  await userEvent.click(btn);
  expect(remoteMocks.get(API_NAVIGATION).navigateToProviderNewConnection).toHaveBeenCalledWith('k8s-provider');
  expect(remoteMocks.get(API_TELEMETRY).track).toHaveBeenCalledWith('nocontext.createNew', {
    provider: 'k8s-provider',
  });
});
