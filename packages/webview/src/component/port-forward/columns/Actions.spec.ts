/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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

import '@testing-library/jest-dom/vitest';

import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import { WorkloadKind, type ForwardConfig, type PortForwardApi, type SystemApi, type PortForwardsInfo } from '@kubernetes-dashboard/channels';
import Actions from './Actions.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_PORT_FORWARD, API_SYSTEM } from '@kubernetes-dashboard/channels';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';

const MOCKED_USER_FORWARD_CONFIG: ForwardConfig = {
  id: 'fake-id',
  name: 'dummy-pod-name',
  namespace: 'dummy-ns',
  kind: WorkloadKind.POD,
  forward: {
    localPort: 55_087,
    remotePort: 80,
  },
};

const remoteMocks = new RemoteMocks();
const statesMocks = new StatesMocks();

const portForwardsMock = new FakeStateObject<PortForwardsInfo, void>();

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    openExternal: vi.fn(),
  } as unknown as SystemApi);
  remoteMocks.mock(API_PORT_FORWARD, {
    deletePortForward: vi.fn(),
  } as unknown as PortForwardApi);

  statesMocks.reset();
  statesMocks.mock<PortForwardsInfo, void>('statePortForwardsInfoUI', portForwardsMock);
  portForwardsMock.setData({
    portForwards: [MOCKED_USER_FORWARD_CONFIG],
  });
});

test('actions should be defined', () => {
  const { getByTitle } = render(Actions, {
    object: MOCKED_USER_FORWARD_CONFIG,
  });

  const openBtn = getByTitle('Open forwarded port');
  expect(openBtn).toBeDefined();

  const deleteBtn = getByTitle('Delete forwarded port');
  expect(deleteBtn).toBeDefined();
});

test('open should call openExternal', async () => {
  const { getByTitle } = render(Actions, {
    object: MOCKED_USER_FORWARD_CONFIG,
  });

  const openBtn = getByTitle('Open forwarded port');
  await fireEvent.click(openBtn);

  expect(remoteMocks.get(API_SYSTEM).openExternal).toHaveBeenCalledWith('http://localhost:55087');
});

test('remove should call deleteKubernetesPortForward', async () => {
  const { getByTitle } = render(Actions, {
    object: MOCKED_USER_FORWARD_CONFIG,
  });

  const deleteBtn = getByTitle('Delete forwarded port');
  await fireEvent.click(deleteBtn);

  expect(remoteMocks.get(API_PORT_FORWARD).deletePortForward).toHaveBeenCalledWith(MOCKED_USER_FORWARD_CONFIG, {
    askConfirmation: true,
  });
});
