/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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

import CopyToClipboard from './CopyToClipboard.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import type { SystemApi } from '@kubernetes-dashboard/channels';

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    clipboardWriteText: vi.fn(),
  } as unknown as SystemApi);
});

test('Expect text to be copied to clipboard', async () => {
  const textToCopy = 'Podman Text';
  const title = 'Podman';

  render(CopyToClipboard, { clipboardData: textToCopy, title });

  const componentText = screen.getByTitle(title);
  expect(componentText).toBeInTheDocument();

  const button = screen.getByRole('button', { name: 'Copy To Clipboard' });

  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();

  await fireEvent.click(button);

  expect(remoteMocks.get(API_SYSTEM).clipboardWriteText).toHaveBeenCalledWith(textToCopy);
});
