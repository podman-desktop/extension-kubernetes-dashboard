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

import * as uiSvelte from '@podman-desktop/ui-svelte';
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import KubernetesEmptyScreen from './KubernetesEmptyScreen.svelte';
import CheckConnection from '/@/component/connection/CheckConnection.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import type { ContextsHealthsInfo } from '/@common/model/contexts-healths-info';
import type { ContextsPermissionsInfo } from '/@common/model/contexts-permissions-info';
import NodeIcon from '/@/component/icons/NodeIcon.svelte';

vi.mock(import('/@/component/connection/CheckConnection.svelte'));

const statesMocks = new StatesMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let contextsHealthsMock: FakeStateObject<ContextsHealthsInfo, void>;
let contextsPermissionsMock: FakeStateObject<ContextsPermissionsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  currentContextMock = new FakeStateObject();
  contextsHealthsMock = new FakeStateObject();
  contextsPermissionsMock = new FakeStateObject();

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<ContextsHealthsInfo, void>('stateContextsHealthsInfoUI', contextsHealthsMock);
  statesMocks.mock<ContextsPermissionsInfo, void>('stateContextsPermissionsInfoUI', contextsPermissionsMock);
});

describe('no current context', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: undefined,
    });
  });

  test('EmptyScreen is called with correct title and message', () => {
    vi.spyOn(uiSvelte, 'EmptyScreen');
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });
    expect(uiSvelte.EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'No current context',
        message: 'There is no current context selected',
      }),
    );
  });

  test('CheckConnection button is not displayed', async () => {
    render(KubernetesEmptyScreen);
    expect(CheckConnection).not.toHaveBeenCalled();
  });
});

describe('current context is not reachable', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });

    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: false,
          checking: false,
          offline: false,
        },
      ],
    });
  });

  test('EmptyScreen is called with correct title and message', () => {
    vi.spyOn(uiSvelte, 'EmptyScreen');
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });
    expect(uiSvelte.EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Context not reachable',
        message: 'The current context is not reachable',
      }),
    );
  });

  test('CheckConnection button is displayed', async () => {
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });

    expect(CheckConnection).toHaveBeenCalled();
  });
});

describe('one resource is not permitted', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });

    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: true,
          checking: false,
          offline: false,
        },
      ],
    });

    contextsPermissionsMock.setData({
      permissions: [
        {
          contextName: 'ctx1',
          resourceName: 'seals',
          permitted: false,
        },
        {
          contextName: 'ctx1',
          resourceName: 'dolphins',
          permitted: true,
        },
      ],
    });
  });

  test('EmptyScreen is called with correct title and message', () => {
    vi.spyOn(uiSvelte, 'EmptyScreen');
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });
    expect(uiSvelte.EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'No seals or dolphins',
        message: 'No seals or dolphins found',
      }),
    );
  });

  test('CheckConnection button is not displayed', async () => {
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });

    expect(CheckConnection).not.toHaveBeenCalled();
  });
});

describe('all resources are not permitted', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });

    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: true,
          checking: false,
          offline: false,
        },
      ],
    });

    contextsPermissionsMock.setData({
      permissions: [
        {
          contextName: 'ctx1',
          resourceName: 'seals',
          permitted: false,
        },
        {
          contextName: 'ctx1',
          resourceName: 'dolphins',
          permitted: false,
        },
      ],
    });
  });

  test('EmptyScreen is called with correct title and message', () => {
    vi.spyOn(uiSvelte, 'EmptyScreen');
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });
    expect(uiSvelte.EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Not accessible',
        message: `You don't have permission to access the seals and dolphins on this context`,
      }),
    );
  });

  test('CheckConnection button is not displayed', async () => {
    render(KubernetesEmptyScreen, {
      icon: NodeIcon,
      resources: ['seals', 'dolphins'],
    });

    expect(CheckConnection).not.toHaveBeenCalled();
  });
});
