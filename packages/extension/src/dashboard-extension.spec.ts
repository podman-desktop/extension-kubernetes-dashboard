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
import { kubernetes, Uri, window } from '@podman-desktop/api';
import { assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { DashboardExtension } from '/@/dashboard-extension';
import { vol } from 'memfs';

import { ContextsManager } from '/@/manager/contexts-manager';
import { ContextsStatesDispatcher } from '/@/manager/contexts-states-dispatcher';

let extensionContextMock: ExtensionContext;
let dashboardExtension: DashboardExtension;
let contextsManagerMock: ContextsManager;
let contextsStatesDispatcherMock: ContextsStatesDispatcher;

vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));
vi.mock(import('@kubernetes/client-node'));
vi.mock(import('./manager/contexts-manager'));
vi.mock(import('./manager/contexts-states-dispatcher'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vol.reset();

  vi.mocked(window.createWebviewPanel).mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
    },
    onDidChangeViewState: vi.fn(),
  } as unknown as WebviewPanel);
  vi.mocked(Uri.joinPath).mockReturnValue({ fsPath: '/path/to/extension/index.html' } as unknown as Uri);
  // Create a mock for the ExtensionContext
  extensionContextMock = {
    subscriptions: [],
  } as unknown as ExtensionContext;

  // Create a mock for the contextsManager
  contextsManagerMock = {
    update: vi.fn(),
    onCurrentContextChange: vi.fn(),
  } as unknown as ContextsManager;
  vi.mocked(ContextsManager).mockReturnValue(contextsManagerMock);

  contextsStatesDispatcherMock = {
    init: vi.fn(),
  } as unknown as ContextsStatesDispatcher;
  vi.mocked(ContextsStatesDispatcher).mockReturnValue(contextsStatesDispatcherMock);

  dashboardExtension = new DashboardExtension(extensionContextMock);
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: '/path/to/kube/config',
  } as Uri);
});

describe('a kubeconfig file is not present', () => {
  beforeEach(() => {
    vol.fromJSON({
      '/path/to/extension/index.html': '<html></html>',
    });
  });

  test('should activate correctly and calls contextsManager every time the kubeconfig file changes', async () => {
    await dashboardExtension.activate();
    expect(contextsManagerMock.update).not.toHaveBeenCalled();

    const callback = vi.mocked(kubernetes.onDidUpdateKubeconfig).mock.lastCall?.[0];
    assert(callback);
    vi.mocked(contextsManagerMock.update).mockClear();
    callback({ type: 'UPDATE', location: { path: '/path/to/kube/config' } as Uri });
    expect(contextsManagerMock.update).toHaveBeenCalledOnce();

    expect(contextsStatesDispatcherMock.init).toHaveBeenCalledOnce();
  });

  test('should deactivate correctly', async () => {
    await dashboardExtension.activate();
    const p = await dashboardExtension.deactivate();
    expect(p).toBeUndefined();
  });
});

describe('a kubeconfig file is present', () => {
  beforeEach(() => {
    vol.fromJSON({
      '/path/to/extension/index.html': '<html></html>',
      '/path/to/kube/config': '{}',
    });
  });

  test('should activate correctly and calls contextsManager every time the kubeconfig file changes', async () => {
    await dashboardExtension.activate();
    expect(contextsManagerMock.update).toHaveBeenCalledOnce();

    const callback = vi.mocked(kubernetes.onDidUpdateKubeconfig).mock.lastCall?.[0];
    assert(callback);
    vi.mocked(contextsManagerMock.update).mockClear();
    callback({ type: 'UPDATE', location: { path: '/path/to/kube/config' } as Uri });
    expect(contextsManagerMock.update).toHaveBeenCalledOnce();

    expect(contextsStatesDispatcherMock.init).toHaveBeenCalledOnce();
  });

  test('should deactivate correctly', async () => {
    await dashboardExtension.activate();
    const p = await dashboardExtension.deactivate();
    expect(p).toBeUndefined();
  });
});
