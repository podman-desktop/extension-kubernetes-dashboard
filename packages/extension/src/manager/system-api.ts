/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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
import type { SystemApi, OpenFileDialogOptions } from '@kubernetes-dashboard/channels';
import * as podmanDesktopApi from '@podman-desktop/api';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';

@injectable()
export class SystemApiImpl implements SystemApi {
  async openExternal(uri: string): Promise<boolean> {
    return podmanDesktopApi.env.openExternal(podmanDesktopApi.Uri.parse(uri));
  }

  async clipboardWriteText(text: string): Promise<void> {
    return podmanDesktopApi.env.clipboard.writeText(text);
  }

  async getFreePort(startPort: number): Promise<number> {
    return podmanDesktopApi.net.getFreePort(startPort);
  }

  async getPlatformName(): Promise<string> {
    return os.platform();
  }

  async openFileDialog(options?: OpenFileDialogOptions): Promise<string[] | undefined> {
    try {
      const result = await podmanDesktopApi.window.showOpenDialog({
        title: options?.title,
        selectors: ['openFile'],
        filters: options?.filters,
      });
      return result?.map(uri => uri.fsPath);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to open file dialog: ${detail}`);
    }
  }

  async readTextFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file '${filePath}': ${detail}`);
    }
  }
}
