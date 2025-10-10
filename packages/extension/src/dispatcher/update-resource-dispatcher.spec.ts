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

import { beforeEach, expect, test, vi } from 'vitest';
import { UpdateResourceDispatcher } from './update-resource-dispatcher';
import type { RpcExtension } from '@podman-desktop/rpc';
import type { ContextsManager } from '../manager/contexts-manager';

const rpcExtension = {
  fire: vi.fn(),
} as unknown as RpcExtension;

const contextsManager = {
  getResources: vi.fn(),
} as unknown as ContextsManager;

beforeEach(() => {
  vi.resetAllMocks();
});

test('getData with explicit context names', () => {
  const dispatcher = new UpdateResourceDispatcher(rpcExtension, contextsManager);
  dispatcher.getData([
    { resourceName: 'resource1', contextName: 'context1' },
    { resourceName: 'resource2', contextName: 'context2' },
  ]);
  expect(contextsManager.getResources).toHaveBeenCalledTimes(2);
  expect(contextsManager.getResources).toHaveBeenCalledWith('resource1', 'context1');
  expect(contextsManager.getResources).toHaveBeenCalledWith('resource2', 'context2');
});

test('getData with implicit context name', () => {
  const dispatcher = new UpdateResourceDispatcher(rpcExtension, contextsManager);
  dispatcher.getData([{ resourceName: 'resource1' }, { resourceName: 'resource2' }]);
  expect(contextsManager.getResources).toHaveBeenCalledTimes(2);
  expect(contextsManager.getResources).toHaveBeenCalledWith('resource1', undefined);
  expect(contextsManager.getResources).toHaveBeenCalledWith('resource2', undefined);
});
