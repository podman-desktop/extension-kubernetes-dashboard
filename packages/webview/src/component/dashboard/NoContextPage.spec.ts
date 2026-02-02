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
import NoContextPage from './NoContextPage.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import {
  API_NAVIGATION,
  API_TELEMETRY,
  type KubernetesProvidersInfo,
  type NavigationApi,
  type TelemetryApi,
} from '@kubernetes-dashboard/channels';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import KubernetesProviderCard from '/@/component/dashboard/KubernetesProviderCard.svelte';
import type { Unsubscriber } from 'svelte/store';
import { RemoteMocks } from '/@/tests/remote-mocks';

vi.mock(import('./KubernetesProviderCard.svelte'));
vi.mock(import('/@/component/icons/KubeIcon.svelte'));

const statesMocks = new StatesMocks();
let kubernetesProvidersMock: FakeStateObject<KubernetesProvidersInfo, void>;
const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  remoteMocks.reset();

  kubernetesProvidersMock = new FakeStateObject<KubernetesProvidersInfo, void>();
  statesMocks.mock<KubernetesProvidersInfo, void>('stateKubernetesProvidersInfoUI', kubernetesProvidersMock);

  remoteMocks.mock(API_NAVIGATION, {
    navigateToExtensionsCatalog: vi.fn(),
  } as unknown as NavigationApi);

  remoteMocks.mock(API_TELEMETRY, {
    track: vi.fn().mockResolvedValue(undefined),
  } as unknown as TelemetryApi);
});

test('should render the Kubernetes icon', () => {
  render(NoContextPage);
  expect(KubeIcon).toHaveBeenCalledWith(expect.anything(), { size: '80' });
});

test('should render the main heading', () => {
  render(NoContextPage);

  const headings = screen.getAllByRole('heading', { level: 1 });
  expect(headings.length).toBeGreaterThan(0);
  expect(headings[0]).toHaveTextContent('No Kubernetes cluster');
});

test('should render the New provider card', () => {
  render(NoContextPage);

  const headings = screen.getAllByRole('heading', { level: 1 });
  expect(headings.length).toBeGreaterThan(1);
  expect(headings[1]).toHaveTextContent('New provider');
});

test('should render the description text', () => {
  render(NoContextPage);

  const description = screen.getByText(/A Kubernetes cluster is a group of nodes/);
  expect(description).toBeInTheDocument();
  expect(description).toHaveClass('text-(--pd-details-empty-sub-header)', 'text-balance');
});

test('should render providers when data is available', () => {
  const mockProviders: KubernetesProvidersInfo = {
    providers: [
      {
        id: 'provider-1',
        creationDisplayName: 'Provider 1',
        creationButtonTitle: 'Create Provider 1',
        emptyConnectionMarkdownDescription: 'Description 1',
      },
      {
        id: 'provider-2',
        creationDisplayName: 'Provider 2',
        creationButtonTitle: 'Create Provider 2',
        emptyConnectionMarkdownDescription: 'Description 2',
      },
    ],
  };

  kubernetesProvidersMock.setData(mockProviders);
  render(NoContextPage);

  expect(KubernetesProviderCard).toHaveBeenCalledWith(expect.anything(), { provider: mockProviders.providers[0] });
  expect(KubernetesProviderCard).toHaveBeenCalledWith(expect.anything(), { provider: mockProviders.providers[1] });
});

test('should handle providers with minimal data', () => {
  const mockProviders = {
    providers: [
      {
        id: 'minimal-provider',
      },
    ],
  };

  kubernetesProvidersMock.setData(mockProviders);
  render(NoContextPage);

  expect(KubernetesProviderCard).toHaveBeenCalledWith(expect.anything(), { provider: mockProviders.providers[0] });
});

test('should call subscribe on mount', () => {
  render(NoContextPage);

  expect(kubernetesProvidersMock.subscribe).toHaveBeenCalledTimes(1);
});

test('should call unsubscribe on unmount', () => {
  const unsubscribeMock: Unsubscriber = vi.fn();
  vi.mocked(kubernetesProvidersMock.subscribe).mockReturnValue(unsubscribeMock);
  const component = render(NoContextPage);

  component.unmount();
  expect(unsubscribeMock).toHaveBeenCalledTimes(1);
});
