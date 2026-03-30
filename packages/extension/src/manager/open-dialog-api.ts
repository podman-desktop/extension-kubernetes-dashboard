/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import { inject, injectable } from 'inversify';
import type { OpenDialogApi } from '@kubernetes-dashboard/channels';
import { OPEN_DIALOG_RESULTS } from '@kubernetes-dashboard/channels';
import * as podmanDesktopApi from '@podman-desktop/api';
import type { OpenDialogOptions } from '@podman-desktop/api';
import { RpcExtension } from '@kubernetes-dashboard/rpc';
import * as fs from 'node:fs/promises';

@injectable()
export class OpenDialogApiImpl implements OpenDialogApi {
  constructor(@inject(RpcExtension) private rpcExtension: RpcExtension) {}

  async openDialog(id: string, options: OpenDialogOptions): Promise<void> {
    podmanDesktopApi.window.showOpenDialog(options).then(
      async uris => {
        const files = uris?.map(uri => uri.fsPath);
        let content: string | undefined;
        if (files?.length === 1) {
          try {
            content = await fs.readFile(files[0], 'utf-8');
          } catch (error: unknown) {
            console.error(`Error reading file: ${String(error)}`);
            podmanDesktopApi.window.showNotification({
              title: 'Error reading file',
              body: `Reading file failed: ${String(error)}`,
              type: 'error',
              highlight: true,
            });
            this.rpcExtension.fire(OPEN_DIALOG_RESULTS, { id, files: undefined }).catch(console.error);
            return;
          }
        }
        this.rpcExtension.fire(OPEN_DIALOG_RESULTS, { id, files, content }).catch((error: unknown) => {
          console.error(`Error sending open dialog result: ${String(error)}`);
          podmanDesktopApi.window.showNotification({
            title: 'Error sending open dialog result',
            body: `Sending open dialog result failed: ${String(error)}`,
            type: 'error',
            highlight: true,
          });
        });
      },
      (error: unknown) => {
        console.error(`Error opening dialog: ${error}`);
        podmanDesktopApi.window.showNotification({
          title: 'Error opening dialog',
          body: `Opening dialog failed: ${String(error)}`,
          type: 'error',
          highlight: true,
        });
        this.rpcExtension.fire(OPEN_DIALOG_RESULTS, { id, files: undefined }).catch(console.error);
      },
    );
  }
}
