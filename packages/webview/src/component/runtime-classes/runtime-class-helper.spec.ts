/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import type { KubernetesObject } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { RuntimeClassHelper } from './runtime-class-helper';

let helper: RuntimeClassHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new RuntimeClassHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      name: 'my-runtime',
      uid: 'uid-rc',
    },
    handler: 'runc',
  } as KubernetesObject;
  const ui = helper.getRuntimeClassUI(obj);
  expect(ui.kind).toEqual('RuntimeClass');
  expect(ui.name).toEqual('my-runtime');
  expect(ui.uid).toEqual('uid-rc');
});

test('expect handler field', async () => {
  const obj = {
    metadata: { name: 'kata-runtime' },
    handler: 'kata',
  } as KubernetesObject;
  const ui = helper.getRuntimeClassUI(obj);
  expect(ui.handler).toEqual('kata');
});

test('expect empty handler when missing', async () => {
  const obj = {
    metadata: { name: 'no-handler' },
  } as KubernetesObject;
  const ui = helper.getRuntimeClassUI(obj);
  expect(ui.handler).toEqual('');
});
