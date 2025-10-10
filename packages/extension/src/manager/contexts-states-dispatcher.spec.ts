/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
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

import type { IDisposable } from '/@common/types/disposable.js';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import { ContextsManager } from './contexts-manager.js';
import { ContextsStatesDispatcher } from './contexts-states-dispatcher.js';
import type { RpcExtension } from '@podman-desktop/rpc';
import type { ExtensionContext, TelemetryLogger } from '@podman-desktop/api';
import type { Container } from 'inversify';
import { InversifyBinding } from '/@/inject/inversify-binding.js';
import { ResourcesCountDispatcher } from '/@/dispatcher/resources-count-dispatcher.js';
import { ActiveResourcesCountDispatcher } from '/@/dispatcher/active-resources-count-dispatcher.js';
import { ContextsHealthsDispatcher } from '/@/dispatcher/contexts-healths-dispatcher.js';
import { ContextsPermissionsDispatcher } from '/@/dispatcher/contexts-permissions-dispatcher.js';
import {
  ACTIVE_RESOURCES_COUNT,
  AVAILABLE_CONTEXTS,
  CONTEXTS_HEALTHS,
  CONTEXTS_PERMISSIONS,
  CURRENT_CONTEXT,
  ENDPOINTS,
  RESOURCE_DETAILS,
  RESOURCE_EVENTS,
  RESOURCES_COUNT,
  UPDATE_RESOURCE,
} from '../../../common/src/index.js';

let container: Container;
const contextsManagerMock: ContextsManager = {
  onContextHealthStateChange: vi.fn(),
  onOfflineChange: vi.fn(),
  onContextPermissionResult: vi.fn(),
  onContextDelete: vi.fn(),
  onContextAdd: vi.fn(),
  getHealthCheckersStates: vi.fn(),
  getPermissions: vi.fn(),
  onResourceCountUpdated: vi.fn(),
  onResourceUpdated: vi.fn(),
  isContextOffline: vi.fn(),
  onCurrentContextChange: vi.fn(),
  onEndpointsChange: vi.fn(),
} as unknown as ContextsManager;
const rpcExtension: RpcExtension = {
  fire: vi.fn(),
} as unknown as RpcExtension;
const extensionContext = {} as ExtensionContext;
const telemetryLogger = {} as TelemetryLogger;
let dispatcher: ContextsStatesDispatcher;

const resourcesCountDispatcher = {
  dispatch: vi.fn(),
} as unknown as ResourcesCountDispatcher;
const activeResourcesCountDispatcher = {
  dispatch: vi.fn(),
} as unknown as ActiveResourcesCountDispatcher;
const contextsHealthsDispatcher = {
  dispatch: vi.fn(),
} as unknown as ContextsHealthsDispatcher;
const contextsPermissionsDispatcher = {
  dispatch: vi.fn(),
} as unknown as ContextsPermissionsDispatcher;

beforeAll(async () => {
  const inversifyBinding = new InversifyBinding(rpcExtension, extensionContext, telemetryLogger);
  container = await inversifyBinding.initBindings();
  (await container.rebind(ContextsManager)).toConstantValue(contextsManagerMock);
  (await container.rebind(ResourcesCountDispatcher)).toConstantValue(resourcesCountDispatcher);
  (await container.rebind(ActiveResourcesCountDispatcher)).toConstantValue(activeResourcesCountDispatcher);
  (await container.rebind(ContextsHealthsDispatcher)).toConstantValue(contextsHealthsDispatcher);
  (await container.rebind(ContextsPermissionsDispatcher)).toConstantValue(contextsPermissionsDispatcher);
});

beforeEach(() => {
  vi.resetAllMocks();
  dispatcher = container.get<ContextsStatesDispatcher>(ContextsStatesDispatcher);
});

test('ContextsStatesDispatcher should call updateHealthStates when onContextHealthStateChange event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onContextHealthStateChange).mockImplementation(
    f => f({} as ContextHealthState) as IDisposable,
  );
  dispatcher.init();
  expect(dispatcherSpy).toHaveBeenCalledOnce();
  expect(dispatcherSpy).toHaveBeenCalledWith(CONTEXTS_HEALTHS);
});

test('ContextsStatesDispatcher should call updateHealthStates, updateResourcesCount and updateActiveResourcesCount when onOfflineChange event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onOfflineChange).mockImplementation(f => f() as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(3);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(expect.objectContaining(CONTEXTS_HEALTHS));
  expect(dispatcherSpy).toHaveBeenCalledWith(expect.objectContaining(RESOURCES_COUNT));
  expect(dispatcherSpy).toHaveBeenCalledWith(expect.objectContaining(ACTIVE_RESOURCES_COUNT));
});

test('ContextsStatesDispatcher should call updatePermissions when onContextPermissionResult event is fired', () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onContextPermissionResult).mockImplementation(
    f => f({} as ContextPermissionResult) as IDisposable,
  );
  dispatcher.init();
  expect(dispatcherSpy).toHaveBeenCalledOnce();
  expect(dispatcherSpy).toHaveBeenCalledWith(CONTEXTS_PERMISSIONS);
});

test('ContextsStatesDispatcher should call updateHealthStates and updatePermissions when onContextDelete event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onContextDelete).mockImplementation(f => f({} as DispatcherEvent) as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(3);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(CONTEXTS_HEALTHS);
  expect(dispatcherSpy).toHaveBeenCalledWith(CONTEXTS_PERMISSIONS);
  expect(dispatcherSpy).toHaveBeenCalledWith(AVAILABLE_CONTEXTS);
});

test('ContextsStatesDispatcher should dispatchavailable contexts when onContextAdd event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onContextAdd).mockImplementation(f => f({} as DispatcherEvent) as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(1);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(AVAILABLE_CONTEXTS);
});

test('ContextsStatesDispatcher should call updateResource and updateActiveResourcesCount when onResourceUpdated event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onResourceUpdated).mockImplementation(
    f => f({ contextName: 'context1', resourceName: 'res1' }) as IDisposable,
  );
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(4);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(UPDATE_RESOURCE);
  expect(dispatcherSpy).toHaveBeenCalledWith(RESOURCE_DETAILS);
  expect(dispatcherSpy).toHaveBeenCalledWith(RESOURCE_EVENTS);
  expect(dispatcherSpy).toHaveBeenCalledWith(ACTIVE_RESOURCES_COUNT);
});

test('ContextsStatesDispatcher should dispatch CURRENT_CONTEXT when onCurrentContextChange event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onCurrentContextChange).mockImplementation(f => f() as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(1);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(CURRENT_CONTEXT);
});

test('dispatchByChannelName is called when onSubscribe emits an event', async () => {
  const dispatchByChannelNameSpy = vi.spyOn(dispatcher, 'dispatchByChannelName').mockResolvedValue();

  vi.spyOn(dispatcher, 'onSubscribe').mockImplementation(f => f('channel1') as IDisposable);
  dispatcher.init();
  expect(dispatchByChannelNameSpy).toHaveBeenCalledWith('channel1');
});

test('ContextsStatesDispatcher should dispatch ENDPOINTS when onEndpointsChange event is fired', async () => {
  const dispatcherSpy = vi.spyOn(dispatcher, 'dispatch').mockResolvedValue();
  dispatcher.init();
  expect(dispatcherSpy).not.toHaveBeenCalled();

  vi.mocked(contextsManagerMock.onEndpointsChange).mockImplementation(f => f() as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(dispatcherSpy).toHaveBeenCalledTimes(1);
  });
  expect(dispatcherSpy).toHaveBeenCalledWith(ENDPOINTS);
});
