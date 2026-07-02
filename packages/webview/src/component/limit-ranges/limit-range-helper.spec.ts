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

import type { V1LimitRange } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { LimitRangeHelper } from './limit-range-helper';

let helper: LimitRangeHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new LimitRangeHelper();
});

test('expect basic UI conversion', async () => {
  const lr = {
    metadata: {
      name: 'my-limit',
      namespace: 'default',
      uid: 'uid-456',
    },
    spec: { limits: [] },
  } as V1LimitRange;
  const ui = helper.getLimitRangeUI(lr);
  expect(ui.kind).toEqual('LimitRange');
  expect(ui.name).toEqual('my-limit');
  expect(ui.namespace).toEqual('default');
  expect(ui.uid).toEqual('uid-456');
});

test('expect limitTypes and limitCount with type', async () => {
  const lr = {
    metadata: { name: 'lr1' },
    spec: {
      limits: [
        {
          type: 'Container',
          _default: { cpu: '500m', memory: '128Mi' },
          defaultRequest: { cpu: '250m' },
        },
      ],
    },
  } as V1LimitRange;
  const ui = helper.getLimitRangeUI(lr);
  expect(ui.limitTypes).toEqual('Container');
  expect(ui.limitCount).toEqual(1);
});

test('expect multiple limit types', async () => {
  const lr = {
    metadata: { name: 'lr2' },
    spec: {
      limits: [{ type: 'Container', _default: { cpu: '500m' } }, { type: 'Pod' }],
    },
  } as V1LimitRange;
  const ui = helper.getLimitRangeUI(lr);
  expect(ui.limitTypes).toEqual('Container, Pod');
  expect(ui.limitCount).toEqual(2);
});

test('expect empty limitTypes when no spec', async () => {
  const lr = {
    metadata: { name: 'empty' },
  } as V1LimitRange;
  const ui = helper.getLimitRangeUI(lr);
  expect(ui.limitTypes).toEqual('');
  expect(ui.limitCount).toEqual(0);
});
