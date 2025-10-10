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

import { render } from '@testing-library/svelte';
import PodTerminal from './PodTerminal.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import {
  API_POD_TERMINALS,
  type PodTerminalsApi,
  type PodTerminalChunk,
  Disposable,
} from '@kubernetes-dashboard/channels';
import { StreamsMocks } from '/@/tests/stream-mocks';
import { Terminal } from '@xterm/xterm';
import { FakeStreamObject } from '/@/stream/util/fake-stream-object.svelte';
import { SerializeAddon } from '@xterm/addon-serialize';
import { FitAddon } from '@xterm/addon-fit';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock(import('@xterm/addon-serialize'));
vi.mock(import('@xterm/addon-fit'));

let terminalCols = 132;
let terminalRows = 30;

vi.mock('@xterm/xterm', () => {
  const Terminal = vi.fn();
  Terminal.prototype = {
    write: vi.fn(),
    focus: vi.fn(),
    loadAddon: vi.fn(),
    open: vi.fn(),
    onData: vi.fn(),
    dispose: vi.fn(),
    get rows(): number {
      return terminalRows;
    },
    get cols(): number {
      return terminalCols;
    },
  };
  return { Terminal };
});

const remoteMocks = new RemoteMocks();
const streamMocks = new StreamsMocks();

const streamPodTerminalsMock = new FakeStreamObject<PodTerminalChunk>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(Terminal.prototype.onData).mockReturnValue(Disposable.create(() => {}));
  streamMocks.reset();
  streamMocks.mock<PodTerminalChunk>('streamPodTerminals', streamPodTerminalsMock);

  remoteMocks.reset();
  remoteMocks.mock(API_POD_TERMINALS, {
    getState: vi.fn(),
    startTerminal: vi.fn(),
    sendData: vi.fn(),
    resizeTerminal: vi.fn(),
    saveState: vi.fn(),
  } as unknown as PodTerminalsApi);
  vi.mocked(remoteMocks.get(API_POD_TERMINALS).saveState).mockResolvedValue(undefined);
});
test('PodTerminal writes data to ther terminal when it receives it from the stream, and saves the terminal screen', async () => {
  const pod = {
    metadata: {
      name: 'pod1',
      namespace: 'ns1',
    },
  };
  render(PodTerminal, { props: { object: pod, containerName: 'container1' } });

  const apiSubscribe = vi.spyOn(streamPodTerminalsMock, 'subscribe');

  await vi.waitFor(() => {
    expect(apiSubscribe).toHaveBeenCalled();
  });

  vi.mocked(SerializeAddon.prototype.serialize).mockReturnValue('previous data - data1');

  streamPodTerminalsMock.sendData({
    podName: 'pod1',
    namespace: 'ns1',
    containerName: 'container1',
    channel: 'stdout',
    data: Buffer.from('data1'),
  });

  expect(Terminal.prototype.write).toHaveBeenCalledWith(Buffer.from('data1'));
  expect(remoteMocks.get(API_POD_TERMINALS).saveState).toHaveBeenCalledWith(
    'pod1',
    'ns1',
    'container1',
    'previous data - data1',
  );
});

test('PodTerminal restores previous screen when it is loaded, and sets focus to the terminal', async () => {
  const pod = {
    metadata: {
      name: 'pod1',
      namespace: 'ns1',
    },
  };
  vi.mocked(remoteMocks.get(API_POD_TERMINALS).getState).mockResolvedValue('previous data');
  render(PodTerminal, { props: { object: pod, containerName: 'container1' } });

  await vi.waitFor(() => {
    expect(Terminal.prototype.write).toHaveBeenCalledWith('previous data');
    expect(Terminal.prototype.focus).toHaveBeenCalled();
  });
});

test('PodTerminal sends data to api when it receives data from the terminal', async () => {
  const pod = {
    metadata: {
      name: 'pod1',
      namespace: 'ns1',
    },
  };
  vi.mocked(remoteMocks.get(API_POD_TERMINALS).sendData).mockResolvedValue(undefined);

  render(PodTerminal, { props: { object: pod, containerName: 'container1' } });
  await vi.waitFor(() => {
    expect(Terminal.prototype.onData).toHaveBeenCalled();
  });
  const onDataCb = vi.mocked(Terminal.prototype.onData).mock.calls[0][0];

  expect(remoteMocks.get(API_POD_TERMINALS).sendData).not.toHaveBeenCalled();
  onDataCb('data2');
  expect(remoteMocks.get(API_POD_TERMINALS).sendData).toHaveBeenCalledWith('pod1', 'ns1', 'container1', 'data2');
});

test('PodTerminal calls resizeTerminal initially then when resized', async () => {
  const pod = {
    metadata: {
      name: 'pod1',
      namespace: 'ns1',
    },
  };
  const addEventListener = vi.spyOn(window, 'addEventListener');
  render(PodTerminal, { props: { object: pod, containerName: 'container1' } });
  await vi.waitFor(() => {
    expect(remoteMocks.get(API_POD_TERMINALS).resizeTerminal).toHaveBeenCalledWith(
      'pod1',
      'ns1',
      'container1',
      132,
      30,
    );
  });
  expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  const resizeCb = addEventListener.mock.calls[0][1] as unknown as () => void;

  vi.mocked(FitAddon.prototype.fit).mockImplementation(() => {
    terminalCols = 120;
    terminalRows = 20;
  });
  resizeCb();
  expect(remoteMocks.get(API_POD_TERMINALS).resizeTerminal).toHaveBeenCalledWith('pod1', 'ns1', 'container1', 120, 20);
});
