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

import { describe, expect, test } from 'vitest';
import { SystemApiImpl } from '/@/manager/system-api';
import * as podmanDesktopApi from '@podman-desktop/api';

describe('getSystemName', async () => {
  const systemApi = new SystemApiImpl();

  test('should return linux', async () => {
    (podmanDesktopApi.env.isLinux as boolean) = true;
    (podmanDesktopApi.env.isMac as boolean) = false;
    (podmanDesktopApi.env.isWindows as boolean) = false;
    const systemName = await systemApi.getSystemName();
    expect(systemName).toBe('linux');
  });

  test('should return mac', async () => {
    (podmanDesktopApi.env.isLinux as boolean) = false;
    (podmanDesktopApi.env.isMac as boolean) = true;
    (podmanDesktopApi.env.isWindows as boolean) = false;
    const systemName = await systemApi.getSystemName();
    expect(systemName).toBe('mac');
  });

  test('should return windows', async () => {
    (podmanDesktopApi.env.isLinux as boolean) = false;
    (podmanDesktopApi.env.isMac as boolean) = false;
    (podmanDesktopApi.env.isWindows as boolean) = true;
    const systemName = await systemApi.getSystemName();
    expect(systemName).toBe('windows');
  });

  test('should return undefined', async () => {
    (podmanDesktopApi.env.isLinux as boolean) = false;
    (podmanDesktopApi.env.isMac as boolean) = false;
    (podmanDesktopApi.env.isWindows as boolean) = false;
    const systemName = await systemApi.getSystemName();
    expect(systemName).toBeUndefined();
  });
});
