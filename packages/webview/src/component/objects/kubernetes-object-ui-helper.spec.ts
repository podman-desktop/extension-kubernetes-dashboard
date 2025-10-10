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
import { KubernetesObjectUIHelper } from './kubernetes-object-ui-helper';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { RpcBrowser } from '@podman-desktop/rpc';
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
let helper: KubernetesObjectUIHelper;

beforeAll(async () => {
  const inversifyBinding = new InversifyBinding({} as RpcBrowser, {} as WebviewApi);
  container = await inversifyBinding.initBindings();
});

beforeEach(() => {
  vi.resetAllMocks();
  helper = container.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);
});

test('isNamespaced is false for nodes', async () => {
  expect(helper.isNamespaced(node)).toBeFalsy();
});

test('isNamespaced is true for deployments', async () => {
  expect(helper.isNamespaced(deployment)).toBeTruthy();
});

test('should expect valid match with string', async () => {
  const object = 'nginx';
  expect(helper.findMatchInLeaves(object, 'nginx')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(false);
});

test('should expect valid match with string and case', async () => {
  const object = 'NgInX';
  expect(helper.findMatchInLeaves(object, 'nginx')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(false);

  const object2 = 'nginx';
  expect(helper.findMatchInLeaves(object2, 'NgInX')).toBe(true);
  expect(helper.findMatchInLeaves(object2, 'foo')).toBe(false);
});

test('should expect valid match with array of string', async () => {
  const object = ['a', 'b', 'my super name'];
  expect(helper.findMatchInLeaves(object, 'name')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'b')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(false);
});

test('should expect valid match with array of string and different case', async () => {
  const object = ['a', 'B', 'My Super Name'];
  expect(helper.findMatchInLeaves(object, 'name')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'b')).toBe(true);
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(false);

  const object2 = ['a', 'b', 'my super name'];
  expect(helper.findMatchInLeaves(object2, 'NaMe')).toBe(true);
  expect(helper.findMatchInLeaves(object2, 'B')).toBe(true);
  expect(helper.findMatchInLeaves(object2, 'foo')).toBe(false);
});

test('should expect valid match with simple object', async () => {
  const object = {
    hello: 'foo',
    baz: undefined,
  };
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(true);

  // should not match on key name
  expect(helper.findMatchInLeaves(object, 'hello')).toBe(false);
});

test('should expect valid match with complex object', async () => {
  const object = {
    hello: {
      hello: {
        hello: 'foo',
      },
    },
  };
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(true);

  // should not match on key name
  expect(helper.findMatchInLeaves(object, 'hello')).toBe(false);
});

test('should expect valid match with complex object and case', async () => {
  const object = {
    hello: {
      hello: {
        hello: 'FoO',
      },
    },
  };
  expect(helper.findMatchInLeaves(object, 'foo')).toBe(true);

  // should not match on key name
  expect(helper.findMatchInLeaves(object, 'hello')).toBe(false);
});
