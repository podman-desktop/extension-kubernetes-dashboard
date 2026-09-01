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

import type { WebviewPanel, ExtensionContext } from '@podman-desktop/api';
import { kubernetes, Uri, window } from '@podman-desktop/api';
import { assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { DashboardExtension } from '/@/dashboard-extension';
import { vol } from 'memfs';

import { ContextsManager } from '/@/manager/contexts-manager';
import { ContextsStatesDispatcher } from '/@/manager/contexts-states-dispatcher';
import { type ApiSubscriber } from '/@/subscriber/api-subscriber';

let extensionContextMock: ExtensionContext;
let dashboardExtension: DashboardExtension;

vi.mock(import('node:fs'));
vi.mock(import('node:fs/promises'));
vi.mock(import('@kubernetes/client-node'));
vi.mock(import('./manager/contexts-manager'));
vi.mock(import('./manager/contexts-states-dispatcher'), () => {
  const ContextsStatesDispatcherMock = vi.fn(
    class {
      constructor() {}
    } as unknown as typeof ContextsStatesDispatcher,
  );
  return { ContextsStatesDispatcher: ContextsStatesDispatcherMock };
});
vi.mock(import('./subscriber/api-subscriber'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vol.reset();
  vol.fromJSON({
    '/path/to/extension/index.html': '<html></html>',
  });

  ContextsManager.prototype.update = vi.fn();
  ContextsManager.prototype.onCurrentContextChange = vi.fn();
  ContextsStatesDispatcher.prototype.init = vi.fn();
  ContextsStatesDispatcher.prototype.addSubscriber = vi.fn();
  ContextsStatesDispatcher.prototype.removeSubscriber = vi.fn();
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

  dashboardExtension = new DashboardExtension(extensionContextMock);
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: '/path/to/kube/config',
  } as Uri);
});

describe('a kubeconfig file is not present', () => {
  test('should activate correctly and calls contextsManager every time the kubeconfig file changes', async () => {
    await dashboardExtension.activate();
    expect(ContextsManager.prototype.update).not.toHaveBeenCalled();

    const callback = vi.mocked(kubernetes.onDidUpdateKubeconfig).mock.lastCall?.[0];
    assert(callback);
    vi.mocked(ContextsManager.prototype.update).mockClear();
    callback({ type: 'UPDATE', location: { path: '/path/to/kube/config' } as Uri });
    expect(ContextsManager.prototype.update).toHaveBeenCalledOnce();
    expect(ContextsStatesDispatcher.prototype.init).toHaveBeenCalledOnce();
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
    expect(ContextsManager.prototype.update).toHaveBeenCalledOnce();

    const callback = vi.mocked(kubernetes.onDidUpdateKubeconfig).mock.lastCall?.[0];
    assert(callback);
    vi.mocked(ContextsManager.prototype.update).mockClear();
    callback({ type: 'UPDATE', location: { path: '/path/to/kube/config' } as Uri });
    expect(ContextsManager.prototype.update).toHaveBeenCalledOnce();

    expect(ContextsStatesDispatcher.prototype.init).toHaveBeenCalledOnce();
  });

  test('should deactivate correctly', async () => {
    await dashboardExtension.activate();
    const p = await dashboardExtension.deactivate();
    expect(p).toBeUndefined();
  });
});

test('activate should return a KubernetesDashboardExtensionApi', async () => {
  const api = await dashboardExtension.activate();
  expect(api).toBeDefined();
  expect(api.getSubscriber).toBeDefined();

  const subscriber = api.getSubscriber();
  expect(subscriber).toBeDefined();
  expect(ContextsStatesDispatcher.prototype.addSubscriber).toHaveBeenCalled();
  const apiSubscriber = vi.mocked(ContextsStatesDispatcher.prototype.addSubscriber).mock.lastCall?.[0];

  subscriber.dispose();
  expect(ContextsStatesDispatcher.prototype.removeSubscriber).toHaveBeenCalled();
  expect(apiSubscriber).toBeDefined();
  expect((apiSubscriber as ApiSubscriber).dispose).toHaveBeenCalledOnce();
});

test('api.patchResources should delegate to ContextsManager.applyResources', async () => {
  ContextsManager.prototype.applyResources = vi.fn();
  const api = await dashboardExtension.activate();

  await api.patchResources('apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test');

  expect(ContextsManager.prototype.applyResources).toHaveBeenCalledWith(
    'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test',
    undefined,
  );
});

test('api.patchResources should forward options to ContextsManager.applyResources', async () => {
  ContextsManager.prototype.applyResources = vi.fn();
  const api = await dashboardExtension.activate();

  await api.patchResources('apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test', {
    strategy: 'merge-patch',
    fieldManager: 'custom-manager',
  });

  expect(ContextsManager.prototype.applyResources).toHaveBeenCalledWith(
    'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test',
    { strategy: 'merge-patch', fieldManager: 'custom-manager' },
  );
});

test('api.deleteResource should delegate to ContextsManager.deleteObjectImmediately', async () => {
  ContextsManager.prototype.deleteObjectImmediately = vi.fn();
  const api = await dashboardExtension.activate();

  await api.deleteResource('Pod', 'my-pod', 'default');

  expect(ContextsManager.prototype.deleteObjectImmediately).toHaveBeenCalledWith('Pod', 'my-pod', 'default');
});

test('api.patchSubresource should delegate to ContextsManager.patchSubresource', async () => {
  ContextsManager.prototype.patchSubresource = vi.fn();
  const api = await dashboardExtension.activate();

  const body = { status: { conditions: [{ type: 'Approved', status: 'True' }] } };
  await api.patchSubresource('certificates.k8s.io/v1', 'certificatesigningrequests', 'my-csr', 'approval', body);

  expect(ContextsManager.prototype.patchSubresource).toHaveBeenCalledWith(
    'certificates.k8s.io/v1',
    'certificatesigningrequests',
    'my-csr',
    'approval',
    body,
    undefined,
  );
});

test('subscriber.onResourceUpdate should subscribe to UPDATE_RESOURCE channel', async () => {
  const api = await dashboardExtension.activate();
  const subscriber = api.getSubscriber();
  const apiSubscriber = vi.mocked(ContextsStatesDispatcher.prototype.addSubscriber).mock.lastCall?.[0] as ApiSubscriber;

  const listener = vi.fn();
  const options = { resourceName: 'pods', contextName: 'my-context' };
  subscriber.onResourceUpdate(options, listener);

  expect(apiSubscriber.subscribe).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'UpdateResource' }),
    options,
    listener,
  );
});
