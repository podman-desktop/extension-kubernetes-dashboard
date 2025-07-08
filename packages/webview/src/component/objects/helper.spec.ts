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

import { beforeAll, beforeEach, expect, test, vi } from 'vitest';

import type { KubernetesNamespacedObjectUI, KubernetesObjectUI } from './KubernetesObjectUI';
import { ObjectHelper } from './helper';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { RpcBrowser } from '/@common/rpc/rpc';
import type { WebviewApi } from '@podman-desktop/webview-api';
import type { Container } from 'inversify';

const node: KubernetesObjectUI = {
  kind: 'Node',
  name: 'my-node',
  status: '',
};

const deployment: KubernetesNamespacedObjectUI = {
  kind: 'Deployment',
  name: 'my-deployment',
  status: '',
  namespace: 'default',
  selected: false,
};

let container: Container;
let objectHelper: ObjectHelper;

beforeAll(async () => {
  const inversifyBinding = new InversifyBinding({} as RpcBrowser, {} as WebviewApi);
  container = await inversifyBinding.initBindings();
});

beforeEach(() => {
  vi.resetAllMocks();
  objectHelper = container.get<ObjectHelper>(ObjectHelper);
});

test('isNamespaced is false for nodes', async () => {
  expect(objectHelper.isNamespaced(node)).toBeFalsy();
});

test('isNamespaced is true for deployments', async () => {
  expect(objectHelper.isNamespaced(deployment)).toBeTruthy();
});
