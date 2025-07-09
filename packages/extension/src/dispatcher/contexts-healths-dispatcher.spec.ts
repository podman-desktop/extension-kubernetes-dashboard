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

import { beforeAll, expect, test, vi } from 'vitest';
import type { ContextHealthState } from '/@/manager/context-health-checker';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import { ContextsHealthsDispatcher } from './contexts-healths-dispatcher';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { ExtensionContext, TelemetryLogger } from '@podman-desktop/api';
import type { RpcExtension } from '/@common/rpc/rpc';
import type { Container } from 'inversify';
import { ContextsManager } from '/@/manager/contexts-manager';

let container: Container;
const contextsManagerMock = {
  getHealthCheckersStates: vi.fn(),
  isContextOffline: vi.fn(),
} as unknown as ContextsManager;

beforeAll(async () => {
  const inversifyBinding = new InversifyBinding({} as RpcExtension, {} as ExtensionContext, {} as TelemetryLogger);
  container = await inversifyBinding.initBindings();
  (await container.rebind(ContextsManager)).toConstantValue(contextsManagerMock);
});

test('getData should return the values of the map returned by manager.getHealthCheckersStates without kubeConfig', () => {
  const dispatcher = container.get<ContextsHealthsDispatcher>(ContextsHealthsDispatcher);
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
  vi.mocked(contextsManagerMock.getHealthCheckersStates).mockReturnValue(value);
  const result = dispatcher.getData();
  expect(result).toEqual({ healths: [context1State, context2State, context3State] });
});
