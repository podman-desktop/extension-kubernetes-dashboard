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

vi.mock(import('/@/component/icons/NewProvider.svelte'));

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  remoteMocks.reset();

  remoteMocks.mock(API_NAVIGATION, {
    navigateToExtensionsCatalog: vi.fn(),
  } as unknown as NavigationApi);

  remoteMocks.mock(API_TELEMETRY, {
    track: vi.fn().mockResolvedValue(undefined),
  } as unknown as TelemetryApi);
});

test('should send telemetry when button clicked', async () => {
  render(NewProviderCard);
  const btn = screen.getByRole('button', { name: 'See available extensions' });
  expect(btn).toBeEnabled();
  await userEvent.click(btn);
  expect(remoteMocks.get(API_TELEMETRY).track).toHaveBeenCalledWith('nocontext.extensionsCatalog');
});
