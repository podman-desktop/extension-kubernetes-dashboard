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
import { StatesMocks } from '/@/tests/state-mocks';
import { API_NAVIGATION, API_TELEMETRY, type NavigationApi, type TelemetryApi } from '@kubernetes-dashboard/channels';
import { RemoteMocks } from '/@/tests/remote-mocks';
import NewProviderCard from '/@/component/dashboard/NewProviderCard.svelte';
import userEvent from '@testing-library/user-event';
import product from '/@/../../../product.json' with { type: 'json' };
import Markdown from '/@/markdown/Markdown.svelte';

vi.mock(import('/@/component/icons/NewProvider.svelte'));
vi.mock(import('/@/../../../product.json'));
vi.mock(import('/@/markdown/Markdown.svelte'));

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  remoteMocks.reset();

  // Mock product.json data
  vi.mocked(product).providerMarkdownText = 'Test provider markdown text';

  remoteMocks.mock(API_NAVIGATION, {
    navigateToExtensionsCatalog: vi.fn(),
  } as unknown as NavigationApi);

  remoteMocks.mock(API_TELEMETRY, {
    track: vi.fn().mockResolvedValue(undefined),
  } as unknown as TelemetryApi);
});

test('should render provider markdown text from product.json', () => {
  render(NewProviderCard);

  // Check that the Markdown component was called with the correct markdown text
  expect(Markdown).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      markdown: 'Test provider markdown text',
    }),
  );
});

test('should not render markdown component when providerMarkdownText is not defined', () => {
  // Set providerMarkdownText to undefined
  vi.mocked(product).providerMarkdownText = undefined as unknown as string;

  render(NewProviderCard);

  // Check that the Markdown component was not called
  expect(Markdown).not.toHaveBeenCalled();
});

test('should send telemetry when button clicked', async () => {
  render(NewProviderCard);
  const btn = screen.getByRole('button', { name: 'See available extensions' });
  expect(btn).toBeEnabled();
  await userEvent.click(btn);
  expect(remoteMocks.get(API_TELEMETRY).track).toHaveBeenCalledWith('nocontext.extensionsCatalog');
});
