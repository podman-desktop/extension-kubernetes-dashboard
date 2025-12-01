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

import { API_POD_LOGS, type PodLogsApi, type PodLogsChunk } from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import { render } from '@testing-library/svelte';
import type { Terminal } from '@xterm/xterm';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PodLogs from './PodLogs.svelte';
import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
import { FakeStreamObject } from '/@/stream/util/fake-stream-object.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { StreamsMocks } from '/@/tests/stream-mocks';

vi.mock(import('../terminal/TerminalWindow.svelte'));
vi.mock(import('@podman-desktop/ui-svelte'));

const remoteMocks = new RemoteMocks();
const streamMocks = new StreamsMocks();

const streamPodLogsMock = new FakeStreamObject<PodLogsChunk>();

// Helper to create a mock terminal
function createMockTerminal(): Terminal {
  return {
    write: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn(),
  } as unknown as Terminal;
}

// Helper to create a pod with the specified containers
function createPod(containerNames: string[]): V1Pod {
  return {
    metadata: {
      name: 'podName',
      namespace: 'namespace',
    },
    spec: {
      containers: containerNames.map(name => ({ name })),
    },
  } as V1Pod;
}

// Helper to setup terminal mock with binding
function setupTerminalMock(terminal: Terminal): void {
  vi.mocked(TerminalWindow).mockImplementation((_, props) => {
    props.terminal = terminal;
    return {};
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  streamMocks.reset();
  streamMocks.mock<PodLogsChunk>('streamPodLogs', streamPodLogsMock);

  remoteMocks.reset();
  remoteMocks.mock(API_POD_LOGS, {} as unknown as PodLogsApi);
});

describe('PodLogs', () => {
  describe('EmptyScreen display', () => {
    test.each([
      { containerCount: 1, containers: ['containerName'] },
      { containerCount: 2, containers: ['cnt1', 'containerName2'] },
    ])('should display "No Log" with $containerCount container(s) when no logs received', ({ containers }) => {
      const pod = createPod(containers);
      render(PodLogs, { object: pod });

      expect(EmptyScreen).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          hidden: false,
        }),
      );
    });

    test('should hide EmptyScreen when logs are received', () => {
      const pod = createPod(['containerName']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'containerName',
        data: 'some logs',
      });

      expect(EmptyScreen).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          hidden: true,
        }),
      );
    });
  });

  describe('log output formatting', () => {
    test('should format single container logs without prefix', () => {
      const pod = createPod(['containerName']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'containerName',
        data: 'simple log line',
      });

      expect(mockedTerminal.write).toHaveBeenCalled();
      const writtenLog = vi.mocked(mockedTerminal.write).mock.calls[0][0] as string;
      expect(writtenLog).toContain('simple log line\r');
      expect(writtenLog).not.toContain('|');
    });

    test('should format multi-container logs with colored prefix and padding', () => {
      const pod = createPod(['cnt1', 'containerName2']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'cnt1',
        data: 'log from cnt1',
      });

      expect(mockedTerminal.write).toHaveBeenCalled();
      const writtenLog = vi.mocked(mockedTerminal.write).mock.calls[0][0] as string;
      expect(writtenLog).toContain('\u001b[36mcnt1\u001b[0m|log from cnt1');
    });

    test('should apply log level colorization', () => {
      const pod = createPod(['containerName']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'containerName',
        data: 'info: Application started',
      });

      const writtenLog = vi.mocked(mockedTerminal.write).mock.calls[0][0] as string;
      // Should contain ANSI color code for info: (cyan)
      expect(writtenLog).toContain('\u001b[36m');
      expect(writtenLog).toContain('\u001b[0m');
      expect(writtenLog).toContain('Application started');
    });

    test('should apply JSON colorization when JSON logs detected', () => {
      const pod = createPod(['containerName']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      // Send JSON log data
      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'containerName',
        data: '{"level":"info","message":"test","count":42}',
      });

      const writtenLog = vi.mocked(mockedTerminal.write).mock.calls[0][0] as string;
      // Should contain ANSI color codes for JSON elements (braces in yellow, numbers in green)
      expect(writtenLog).toContain('\u001b[33m{\u001b[0m'); // yellow brace
      expect(writtenLog).toContain('\u001b[32m42\u001b[0m'); // green number
    });
  });

  describe('terminal initialization', () => {
    test('should clear terminal and create TerminalWindow on mount', () => {
      const pod = createPod(['containerName']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      expect(mockedTerminal.clear).toHaveBeenCalled();
      expect(TerminalWindow).toHaveBeenCalled();
    });
  });

  describe('multi-container prefix colors', () => {
    test('should apply colored prefixes for each container', () => {
      const pod = createPod(['container1', 'container2', 'container3']);
      const mockedTerminal = createMockTerminal();
      setupTerminalMock(mockedTerminal);

      render(PodLogs, { object: pod });

      // Send log from first container
      streamPodLogsMock.sendData({
        podName: 'podName',
        namespace: 'namespace',
        containerName: 'container1',
        data: 'log message',
      });

      const calls = vi.mocked(mockedTerminal.write).mock.calls;
      // First container should have cyan prefix
      expect(calls[0][0]).toContain('\u001b[36mcontainer1\u001b[0m|');
    });
  });
});
