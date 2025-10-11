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

import { router } from 'tinro';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';

import { Navigator } from '/@/navigation/navigator';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { RpcBrowser } from '@kubernetes-dashboard/rpc';
import type { WebviewApi } from '@podman-desktop/webview-api';
import type { Container } from 'inversify';

vi.mock(import('tinro'));

let navigator: Navigator;
let container: Container;

beforeAll(async () => {
  const inversifyBinding = new InversifyBinding({} as RpcBrowser, {} as WebviewApi);
  container = await inversifyBinding.initBindings();
});

beforeEach(() => {
  vi.resetAllMocks();
  navigator = container.get<Navigator>(Navigator);
});

test(`navigation to Nodes`, () => {
  navigator.navigateTo({ kind: 'Node' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/nodes');
});

test(`navigation to a specific Node`, () => {
  navigator.navigateTo({ kind: 'Node', name: 'dummy-name' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/nodes/dummy-name/summary');
});

test(`navigation to Services`, () => {
  navigator.navigateTo({ kind: 'Service' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/services');
});

test(`navigation to a specific Service`, () => {
  navigator.navigateTo({ kind: 'Service', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/services/dummy-name/dummy-ns/summary');
});

test(`navigation to Deployments`, () => {
  navigator.navigateTo({ kind: 'Deployment' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/deployments');
});

test(`navigation to a specific Deployment`, () => {
  navigator.navigateTo({ kind: 'Deployment', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/deployments/dummy-name/dummy-ns/summary');
});

test(`navigation to Pods`, () => {
  navigator.navigateTo({ kind: 'Pod' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/pods');
});

test(`navigation to a specific Pod`, () => {
  navigator.navigateTo({ kind: 'Pod', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/pods/dummy-name/dummy-ns/summary');
});

test(`navigation to PersistentVolumeClaims`, () => {
  navigator.navigateTo({ kind: 'PersistentVolumeClaim' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/persistentvolumeclaims');
});

test(`navigation to a specific PersistentVolumeClaim`, () => {
  navigator.navigateTo({ kind: 'PersistentVolumeClaim', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/persistentvolumeclaims/dummy-name/dummy-ns/summary');
});

test(`navigation to Ingresses`, () => {
  navigator.navigateTo({ kind: 'Ingress' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/ingressesRoutes');
});

test(`navigation to a specific Ingress`, () => {
  navigator.navigateTo({ kind: 'Ingress', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/ingressesRoutes/ingress/dummy-name/dummy-ns/summary');
});

test(`navigation to Routes`, () => {
  navigator.navigateTo({ kind: 'Route' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/ingressesRoutes');
});

test(`navigation to a specific Route`, () => {
  navigator.navigateTo({ kind: 'Route', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/ingressesRoutes/route/dummy-name/dummy-ns/summary');
});

test(`navigation to ConfigMaps`, () => {
  navigator.navigateTo({ kind: 'ConfigMap' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/configmapsSecrets');
});

test(`navigation to a specific ConfigMap`, () => {
  navigator.navigateTo({ kind: 'ConfigMap', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/configmapsSecrets/configmap/dummy-name/dummy-ns/summary');
});

test(`navigation to Secrets`, () => {
  navigator.navigateTo({ kind: 'Secret' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/configmapsSecrets');
});

test(`navigation to a specific Secret`, () => {
  navigator.navigateTo({ kind: 'Secret', name: 'dummy-name', namespace: 'dummy-ns' });

  expect(vi.mocked(router.goto)).toHaveBeenCalledWith('/configmapsSecrets/secret/dummy-name/dummy-ns/summary');
});
