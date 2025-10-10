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
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import type { EndpointsInfo } from '/@common/model/endpoints-info';
import type { EndpointsOptions } from '/@common/model/endpoints-options';
import * as svelte from 'svelte';
import OpenLinks from './OpenLinks.svelte';
import { render } from '@testing-library/svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_SYSTEM } from '/@common/channels';
import type { SystemApi } from '/@common/interface/system-api';
import IconButton from '/@/component/button/IconButton.svelte';

vi.mock(import('/@/component/button/IconButton.svelte'), () => ({
  default: vi.fn(),
}));

const statesMocks = new StatesMocks();
const remoteMocks = new RemoteMocks();

let endpointsMock: FakeStateObject<EndpointsInfo, EndpointsOptions>;
let currentContextMock: FakeStateObject<CurrentContextInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  endpointsMock = new FakeStateObject();
  currentContextMock = new FakeStateObject();

  vi.spyOn(svelte, 'getContext').mockImplementation(() => {});

  statesMocks.reset();
  statesMocks.mock<EndpointsInfo, EndpointsOptions>('stateEndpointsInfoUI', endpointsMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);

  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    openExternal: vi.fn(),
  } as unknown as SystemApi);
});

test('OpenLinks component', () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  endpointsMock.setData({
    endpoints: [
      {
        contextName: 'ctx1',
        targetKind: 'Pod',
        targetName: 'pod1',
        targetNamespace: 'ns1',
        inputName: 'ingress1',
        inputKind: 'Ingress',
        url: 'http://example.com/path/to/pod1',
      },
    ],
  });
  render(OpenLinks, { object: { name: 'pod1', namespace: 'ns1', containers: [], kind: 'Pod', status: 'Running' } });
  expect(IconButton).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      title: 'Open ingress1',
    }),
  );
  const call = vi.mocked(IconButton).mock.calls[0][1];
  call.onClick!();
  expect(remoteMocks.get(API_SYSTEM).openExternal).toHaveBeenCalledWith('http://example.com/path/to/pod1');
});
