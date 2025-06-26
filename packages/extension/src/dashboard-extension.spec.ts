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

import type { WebviewPanel, ExtensionContext } from '@podman-desktop/api';
import { Uri, window } from '@podman-desktop/api';
import { beforeEach, test, vi } from 'vitest';
import { DashboardExtension } from './dashboard-extension';

import { readFile } from 'node:fs/promises';

let extensionContextMock: ExtensionContext;
let dashboardExtension: DashboardExtension;

vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  vi.mocked(window.createWebviewPanel).mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
    },
  } as unknown as WebviewPanel);
  vi.mocked(Uri.joinPath).mockReturnValue({ fsPath: '' } as unknown as Uri);
  vi.mocked(readFile).mockResolvedValue('<html></html>');
  // Create a mock for the ExtensionContext
  extensionContextMock = {
    subscriptions: [],
  } as unknown as ExtensionContext;
  dashboardExtension = new DashboardExtension(extensionContextMock);
});

test('should activate correctly', async () => {
  await dashboardExtension.activate();
});

test('should deactivate correctly', async () => {
  await dashboardExtension.activate();
  await dashboardExtension.deactivate();
});
