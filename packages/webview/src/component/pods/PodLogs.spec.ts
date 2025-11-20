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

import {
  API_POD_LOGS,
  type PodLogsApi,
  type PodLogsChunk,
  type TerminalSettings,
} from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import { render } from '@testing-library/svelte';
import type { Terminal } from '@xterm/xterm';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PodLogs from './PodLogs.svelte';
import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import { FakeStreamObject } from '/@/stream/util/fake-stream-object.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { StatesMocks } from '/@/tests/state-mocks';
import { StreamsMocks } from '/@/tests/stream-mocks';

vi.mock(import('../terminal/TerminalWindow.svelte'));
vi.mock(import('@podman-desktop/ui-svelte'));

const remoteMocks = new RemoteMocks();
const streamMocks = new StreamsMocks();
const statesMocks = new StatesMocks();

const streamPodLogsMock = new FakeStreamObject<PodLogsChunk>();
const terminalSettingsMock = new FakeStateObject<TerminalSettings, void>();

beforeEach(() => {
  vi.resetAllMocks();
  streamMocks.reset();
  streamMocks.mock<PodLogsChunk>('streamPodLogs', streamPodLogsMock);

  remoteMocks.reset();
  remoteMocks.mock(API_POD_LOGS, {} as unknown as PodLogsApi);

  statesMocks.reset();
  statesMocks.mock<TerminalSettings, void>('stateTerminalSettingsInfoUI', terminalSettingsMock);
  terminalSettingsMock.setData({
    fontSize: 12,
    lineHeight: 1.2,
    scrollback: 1000,
  });
  // Ensure subscribe returns an unsubscribe function after resetAllMocks
  vi.mocked(terminalSettingsMock.subscribe).mockReturnValue(() => {});
});

describe('pod with one container', async () => {
  let pod: V1Pod;
  beforeEach(() => {
    pod = {
      metadata: {
        name: 'podName',
        namespace: 'namespace',
      },
      spec: {
        containers: [
          {
            name: 'containerName',
          },
        ],
      },
    } as V1Pod;
  });

  test('display No Logwith no logs', async () => {
    render(PodLogs, { object: pod });
    expect(EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        hidden: false,
      }),
    );
  });

  test('write received logs to the terminal', async () => {
    const mockedTerminal: Terminal = {
      write: vi.fn(),
      dispose: vi.fn(),
      clear: vi.fn(),
    } as unknown as Terminal;
    vi.mocked(TerminalWindow).mockImplementation((_, props) => {
      props.terminal = mockedTerminal;
      return {};
    });
    render(PodLogs, { object: pod });
    expect(mockedTerminal.write).not.toHaveBeenCalledWith();
    expect(mockedTerminal.clear).toHaveBeenCalled();
    expect(TerminalWindow).toHaveBeenCalled();

    streamPodLogsMock.sendData({
      podName: 'podName',
      namespace: 'namespace',
      containerName: 'containerName',
      data: 'some logs',
    });
    expect(mockedTerminal.write).toHaveBeenCalledWith('some logs\r');
    expect(EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        hidden: true,
      }),
    );
  });
});

describe('pod with two containers', async () => {
  let pod: V1Pod;
  beforeEach(() => {
    pod = {
      metadata: {
        name: 'podName',
        namespace: 'namespace',
      },
      spec: {
        containers: [
          {
            name: 'cnt1',
          },
          {
            name: 'containerName2',
          },
        ],
      },
    } as V1Pod;
  });

  test('display No Logwith no logs', async () => {
    render(PodLogs, { object: pod });
    expect(EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        hidden: false,
      }),
    );
  });

  test('write received logs to the terminal v2', async () => {
    const mockedTerminal: Terminal = {
      write: vi.fn(),
      dispose: vi.fn(),
      clear: vi.fn(),
    } as unknown as Terminal;
    vi.mocked(TerminalWindow).mockImplementation((_, props) => {
      props.terminal = mockedTerminal;
      return {};
    });
    render(PodLogs, { object: pod });
    expect(mockedTerminal.write).not.toHaveBeenCalledWith();
    expect(mockedTerminal.clear).toHaveBeenCalled();
    expect(TerminalWindow).toHaveBeenCalled();

    streamPodLogsMock.sendData({
      podName: 'podName',
      namespace: 'namespace',
      containerName: 'cnt1',
      data: 'some logs',
    });
    expect(mockedTerminal.write).toHaveBeenCalledWith('          \u001b[36mcnt1\u001b[0m|some logs\r');
    expect(EmptyScreen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        hidden: true,
      }),
    );
  });
});
