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

import { expect, test, vi } from 'vitest';

import type { IDisposable } from '/@/types/disposable.js';
import type { ContextPermission } from '/@common/model/kubernetes-contexts-permissions.js';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import type { ContextsManager } from './contexts-manager.js';
import { ContextsStatesDispatcher } from './contexts-states-dispatcher.js';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { RpcExtension } from '/@common/rpc/rpc.js';
import { CONTEXTS_HEALTHS, CONTEXTS_PERMISSIONS, RESOURCES_COUNT, UPDATE_RESOURCE } from '/@common/channels.js';

test('ContextsStatesDispatcher should call updateHealthStates when onContextHealthStateChange event is fired', () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    onResourceCountUpdated: vi.fn(),
    onResourceUpdated: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  const updateHealthStatesSpy = vi.spyOn(dispatcher, 'updateHealthStates').mockResolvedValue();
  const updatePermissionsSpy = vi.spyOn(dispatcher, 'updatePermissions').mockResolvedValue();
  dispatcher.init();
  expect(updateHealthStatesSpy).not.toHaveBeenCalled();
  expect(updatePermissionsSpy).not.toHaveBeenCalled();

  vi.mocked(manager.onContextHealthStateChange).mockImplementation(f => f({} as ContextHealthState) as IDisposable);
  vi.mocked(manager.getHealthCheckersStates).mockReturnValue(new Map<string, ContextHealthState>());
  dispatcher.init();
  expect(updateHealthStatesSpy).toHaveBeenCalled();
  expect(updatePermissionsSpy).not.toHaveBeenCalled();
});

test('ContextsStatesDispatcher should call updateHealthStates, updateResourcesCount and updateActiveResourcesCount when onOfflineChange event is fired', async () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    onResourceCountUpdated: vi.fn(),
    onResourceUpdated: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  const updateHealthStatesSpy = vi.spyOn(dispatcher, 'updateHealthStates').mockResolvedValue();
  const updateResourcesCountSpy = vi.spyOn(dispatcher, 'updateResourcesCount').mockResolvedValue();
  const updateActiveResourcesCountSpy = vi.spyOn(dispatcher, 'updateActiveResourcesCount').mockResolvedValue();
  dispatcher.init();
  expect(updateHealthStatesSpy).not.toHaveBeenCalled();
  expect(updateResourcesCountSpy).not.toHaveBeenCalled();
  expect(updateActiveResourcesCountSpy).not.toHaveBeenCalled();

  vi.mocked(manager.onOfflineChange).mockImplementation(f => f() as IDisposable);
  vi.mocked(manager.getHealthCheckersStates).mockReturnValue(new Map<string, ContextHealthState>());
  dispatcher.init();
  await vi.waitFor(() => {
    expect(updateHealthStatesSpy).toHaveBeenCalled();
    expect(updateResourcesCountSpy).toHaveBeenCalled();
    expect(updateActiveResourcesCountSpy).toHaveBeenCalled();
  });
});

test('ContextsStatesDispatcher should call updatePermissions when onContextPermissionResult event is fired', () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    onResourceCountUpdated: vi.fn(),
    onResourceUpdated: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.mocked(manager.getPermissions).mockReturnValue([]);
  const updateHealthStatesSpy = vi.spyOn(dispatcher, 'updateHealthStates').mockResolvedValue();
  const updatePermissionsSpy = vi.spyOn(dispatcher, 'updatePermissions').mockResolvedValue();
  dispatcher.init();
  expect(updateHealthStatesSpy).not.toHaveBeenCalled();
  expect(updatePermissionsSpy).not.toHaveBeenCalled();

  vi.mocked(manager.onContextPermissionResult).mockImplementation(f => f({} as ContextPermissionResult) as IDisposable);
  dispatcher.init();
  expect(updateHealthStatesSpy).not.toHaveBeenCalled();
  expect(updatePermissionsSpy).toHaveBeenCalled();
});

test('ContextsStatesDispatcher should call updateHealthStates and updatePermissions when onContextDelete event is fired', async () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    onResourceCountUpdated: vi.fn(),
    onResourceUpdated: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.mocked(manager.getPermissions).mockReturnValue([]);
  const updateHealthStatesSpy = vi.spyOn(dispatcher, 'updateHealthStates').mockResolvedValue();
  const updatePermissionsSpy = vi.spyOn(dispatcher, 'updatePermissions').mockResolvedValue();
  vi.mocked(manager.getHealthCheckersStates).mockReturnValue(new Map<string, ContextHealthState>());
  dispatcher.init();
  expect(updateHealthStatesSpy).not.toHaveBeenCalled();
  expect(updatePermissionsSpy).not.toHaveBeenCalled();

  vi.mocked(manager.onContextDelete).mockImplementation(f => f({} as DispatcherEvent) as IDisposable);
  dispatcher.init();
  await vi.waitFor(() => {
    expect(updateHealthStatesSpy).toHaveBeenCalled();
    expect(updatePermissionsSpy).toHaveBeenCalled();
  });
});

test('ContextsStatesDispatcher should call updateResource and updateActiveResourcesCount when onResourceUpdated event is fired', async () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    onResourceCountUpdated: vi.fn(),
    onResourceUpdated: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.mocked(manager.getPermissions).mockReturnValue([]);
  const updateResourceSpy = vi.spyOn(dispatcher, 'updateResource').mockResolvedValue();
  const updateActiveResourcesCountSpy = vi.spyOn(dispatcher, 'updateActiveResourcesCount').mockResolvedValue();
  vi.mocked(manager.getHealthCheckersStates).mockReturnValue(new Map<string, ContextHealthState>());
  dispatcher.init();
  expect(updateResourceSpy).not.toHaveBeenCalled();
  expect(updateActiveResourcesCountSpy).not.toHaveBeenCalled();

  vi.mocked(manager.onResourceUpdated).mockImplementation(
    f => f({} as { contextName: string; resourceName: string }) as IDisposable,
  );
  dispatcher.init();
  await vi.waitFor(() => {
    expect(updateResourceSpy).toHaveBeenCalled();
    expect(updateActiveResourcesCountSpy).toHaveBeenCalled();
  });
});

test('getContextsHealths should return the values of the map returned by manager.getHealthCheckersStates without kubeConfig', () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onOfflineChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
    isContextOffline: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  const context1State = {
    contextName: 'context1',
    checking: true,
    reachable: false,
  };
  const context2State = {
    contextName: 'context2',
    checking: false,
    reachable: true,
  };
  const context3State = {
    contextName: 'context3',
    checking: false,
    reachable: false,
    errorMessage: 'an error',
  };
  const value = new Map<string, ContextHealthState>([
    ['context1', { ...context1State, kubeConfig: {} as unknown as KubeConfigSingleContext }],
    ['context2', { ...context2State, kubeConfig: {} as unknown as KubeConfigSingleContext }],
    ['context3', { ...context3State, kubeConfig: {} as unknown as KubeConfigSingleContext }],
  ]);
  vi.mocked(manager.getHealthCheckersStates).mockReturnValue(value);
  const result = dispatcher.getContextsHealths();
  expect(result).toEqual([context1State, context2State, context3State]);
});

test('updateHealthStates should call rpcExtension.fire with CONTEXTS_HEALTHS and data', async () => {
  const manager: ContextsManager = {
    onContextHealthStateChange: vi.fn(),
    onContextPermissionResult: vi.fn(),
    onContextDelete: vi.fn(),
    getHealthCheckersStates: vi.fn(),
    getPermissions: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.spyOn(dispatcher, 'getContextsHealths').mockReturnValue([]);
  await dispatcher.updateHealthStates();
  expect(rpcExtension.fire).toHaveBeenCalledWith(CONTEXTS_HEALTHS, { healths: [] });
});

test('getContextsPermissions should return the values as an array', () => {
  const manager: ContextsManager = {
    getPermissions: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  const value: ContextPermission[] = [
    {
      contextName: 'context1',
      resourceName: 'resource1',
      permitted: true,
      reason: 'ok',
    },
    {
      contextName: 'context1',
      resourceName: 'resource2',
      permitted: false,
      reason: 'nok',
    },
    {
      contextName: 'context2',
      resourceName: 'resource1',
      permitted: false,
      reason: 'nok',
    },
    {
      contextName: 'context2',
      resourceName: 'resource2',
      permitted: true,
      reason: 'ok',
    },
  ];
  vi.mocked(manager.getPermissions).mockReturnValue(value);
  const result = dispatcher.getContextsPermissions();
  expect(result).toEqual(value);
});

test('updatePermissions should call rpcExtension.fire with CONTEXTS_PERMISSIONS and data', async () => {
  const manager: ContextsManager = {
    getPermissions: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.spyOn(dispatcher, 'getContextsPermissions').mockReturnValue([]);
  await dispatcher.updatePermissions();
  expect(rpcExtension.fire).toHaveBeenCalledWith(CONTEXTS_PERMISSIONS, { permissions: [] });
});

test('updateResourcesCount should call rpcExtension.fire with RESOURCES_COUNT and data', async () => {
  const manager: ContextsManager = {
    getResourcesCount: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.spyOn(dispatcher, 'getResourcesCount').mockReturnValue([]);
  await dispatcher.updateResourcesCount();
  expect(rpcExtension.fire).toHaveBeenCalledWith(RESOURCES_COUNT, { counts: [] });
});

test('updateResource should call rpcExtension.fire with UPDATE_RESOURCE and data', async () => {
  const manager: ContextsManager = {
    getResources: vi.fn(),
  } as unknown as ContextsManager;
  const rpcExtension: RpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  const dispatcher = new ContextsStatesDispatcher(manager, rpcExtension);
  vi.spyOn(dispatcher, 'getResources').mockReturnValue([]);
  await dispatcher.updateResource('resource1', 'context1');
  expect(rpcExtension.fire).toHaveBeenCalledWith(UPDATE_RESOURCE, {
    contextName: 'context1',
    resourceName: 'resource1',
    resources: [],
  });
});
