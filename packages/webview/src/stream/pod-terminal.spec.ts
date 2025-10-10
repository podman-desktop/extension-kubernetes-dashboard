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

import type { Remote } from '../remote/remote';
import { StreamPodTerminals } from './pod-terminals';
import type { PodTerminalsApi } from '/@common/interface/pod-terminals-api';
import type { PodTerminalChunk } from '/@common/model/pod-terminal-chunk';
import type { RpcBrowser } from '@podman-desktop/rpc';
import type { IDisposable } from '/@common/types/disposable';
import { beforeEach, expect, test, vi } from 'vitest';

const remoteMock = {
  getProxy: vi.fn(),
} as Remote;

const rpcBrowserMock = {
  on: vi.fn(),
} as unknown as RpcBrowser;

const podTerminalApiMock = {
  startTerminal: vi.fn(),
} as unknown as PodTerminalsApi;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(remoteMock.getProxy).mockReturnValue(podTerminalApiMock);
  vi.mocked(podTerminalApiMock.startTerminal).mockResolvedValue(undefined);
});

test('StreamPodTerminals', async () => {
  const rpcDisposable1 = {
    dispose: vi.fn(),
  } as IDisposable;
  vi.mocked(rpcBrowserMock.on).mockReturnValueOnce(rpcDisposable1);
  const rpcDisposable2 = {
    dispose: vi.fn(),
  } as IDisposable;
  vi.mocked(rpcBrowserMock.on).mockReturnValueOnce(rpcDisposable2);
  const streamPodTerminals = new StreamPodTerminals(remoteMock, rpcBrowserMock);
  const callback1: (chunk: PodTerminalChunk) => void = vi.fn();
  const callback2: (chunk: PodTerminalChunk) => void = vi.fn();

  const subscribeResult1 = await streamPodTerminals.subscribe('podName', 'namespace', 'containerName1', callback1);
  const subscribeResult2 = await streamPodTerminals.subscribe('podName', 'namespace', 'containerName2', callback2);
  expect(podTerminalApiMock.startTerminal).toHaveBeenCalledWith('podName', 'namespace', 'containerName1');
  expect(podTerminalApiMock.startTerminal).toHaveBeenCalledWith('podName', 'namespace', 'containerName2');
  expect(rpcBrowserMock.on).toHaveBeenCalledTimes(2);
  const chunkCallback1 = vi.mocked(rpcBrowserMock.on).mock.calls[0][1];
  const chunkCallback2 = vi.mocked(rpcBrowserMock.on).mock.calls[1][1];
  // backend will send data to all subscribers every time
  chunkCallback1({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName1',
    channel: 'stdout',
    data: Buffer.from('data1'),
  });
  chunkCallback2({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName1',
    channel: 'stdout',
    data: Buffer.from('data1'),
  });

  chunkCallback1({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName2',
    channel: 'stdout',
    data: Buffer.from('data2'),
  });
  chunkCallback2({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName2',
    channel: 'stdout',
    data: Buffer.from('data2'),
  });

  // expect the data is sent to the correct subscriber
  expect(callback1).toHaveBeenCalledOnce();
  expect(callback1).toHaveBeenCalledWith({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName1',
    channel: 'stdout',
    data: Buffer.from('data1'),
  });
  expect(callback2).toHaveBeenCalledOnce();
  expect(callback2).toHaveBeenCalledWith({
    podName: 'podName',
    namespace: 'namespace',
    containerName: 'containerName2',
    channel: 'stdout',
    data: Buffer.from('data2'),
  });

  // Expect disposables are disposed
  subscribeResult1.dispose();
  subscribeResult2.dispose();
  expect(rpcDisposable1.dispose).toHaveBeenCalledOnce();
  expect(rpcDisposable2.dispose).toHaveBeenCalledOnce();
});
