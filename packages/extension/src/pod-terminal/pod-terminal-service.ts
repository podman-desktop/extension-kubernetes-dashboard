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

import { injectable } from 'inversify';
import { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import { Exec, V1Status } from '@kubernetes/client-node';
import { POD_TERMINAL_DATA } from '@kubernetes-dashboard/channels';
import { BufferedStreamWriter, ExecStreamWriter, ResizableTerminalWriter, StringLineReader } from './exec-transmitter';
import WebSocket from 'isomorphic-ws';

@injectable()
export class PodTerminalService {
  #stdin: StringLineReader;
  #stdout: ExecStreamWriter;
  #stderr: ExecStreamWriter;
  #stdoutResizableTerminalWriter: ResizableTerminalWriter;
  #stderrResizableTerminalWriter: ResizableTerminalWriter;
  #state: string;
  #conn: WebSocket.WebSocket;

  constructor(
    private readonly context: KubeConfigSingleContext,
    private readonly rpcExtension: RpcExtension,
    private readonly podName: string,
    private readonly namespace: string,
    private readonly containerName: string,
  ) {}

  onData(channel: 'stdout' | 'stderr'): (data: Buffer) => void {
    return (data: Buffer) => {
      this.rpcExtension
        .fire(POD_TERMINAL_DATA, {
          podName: this.podName,
          namespace: this.namespace,
          containerName: this.containerName,
          channel,
          data,
        })
        .catch(console.error);
    };
  }

  async startTerminal(onClose: () => Promise<void>): Promise<void> {
    this.#stdoutResizableTerminalWriter = new ResizableTerminalWriter(new BufferedStreamWriter(this.onData('stdout')));
    this.#stderrResizableTerminalWriter = new ResizableTerminalWriter(new BufferedStreamWriter(this.onData('stderr')));
    this.#stdout = new ExecStreamWriter(this.#stdoutResizableTerminalWriter);
    this.#stderr = new ExecStreamWriter(this.#stderrResizableTerminalWriter);
    this.#stdin = new StringLineReader();

    const exec = new Exec(this.context.getKubeConfig());
    this.#conn = await exec.exec(
      this.namespace,
      this.podName,
      this.containerName,
      ['/bin/sh', '-c', 'if command -v bash >/dev/null 2>&1; then bash; else sh; fi'],
      this.#stdout,
      this.#stderr,
      this.#stdin,
      true,
      (_: V1Status) => {
        // need to think, maybe it would be better to pass exit code to the client, but on the other hand
        // if connection is idle for 15 minutes, websocket connection closes automatically and this handler
        // does not call. also need to separate SIGTERM signal (143) and normally exit signals to be able to
        // proper reconnect client terminal. at this moment we ignore status and rely on websocket close event
      },
    );
    this.#conn.on('close', (): void => {
      this.#stdoutResizableTerminalWriter.end();
      this.#stderrResizableTerminalWriter.end();
      this.#stdout.end();
      this.#stderr.end();
      this.#stdin.destroy();
      onClose().catch(console.error);
    });
  }

  async sendData(data: string): Promise<void> {
    this.#stdin.readLine(data);
  }

  async resizeTerminal(cols: number, rows: number): Promise<void> {
    this.#stdoutResizableTerminalWriter.resize({ width: cols, height: rows });
  }

  async saveState(state: string): Promise<void> {
    this.#state = state;
  }

  async getState(): Promise<string> {
    return this.#state;
  }

  stopTerminal(): void {
    this.#conn.close();
  }
}
