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

import type { UUID } from 'node:crypto';
import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PortForwardService } from './port-forward-service';
import type { ConfigManagementService } from './port-forward-storage';
import type { PortForwardConnectionService } from './port-forward-connection';
import { type ForwardConfig, WorkloadKind, type IDisposable } from '@kubernetes-dashboard/channels';

vi.mock('./port-forward-connection.js');
vi.mock('./port-forward-storage.js');
vi.mock('./port-forward-validation.js');
vi.mock('node:crypto');

describe('KubernetesPortForwardService', () => {
  let mockConfigManagementService: ConfigManagementService;
  let mockForwardingConnectionService: PortForwardConnectionService;
  let service: PortForwardService;

  const sampleForwardConfig: ForwardConfig = {
    id: 'fake-id',
    name: 'test-name',
    namespace: 'test-namespace',
    kind: WorkloadKind.POD,
    forward: { localPort: 8080, remotePort: 80 },
  };

  const onForwardsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigManagementService = {
      createForward: vi.fn().mockResolvedValue(sampleForwardConfig),
      deleteForward: vi.fn().mockResolvedValue(undefined),
      updateForward: vi.fn().mockResolvedValue(sampleForwardConfig),
      listForwards: vi.fn().mockReturnValue([sampleForwardConfig]),
    } as unknown as ConfigManagementService;

    mockForwardingConnectionService = {
      startForward: vi.fn().mockResolvedValue({ dispose: vi.fn() } as unknown as IDisposable),
    } as unknown as PortForwardConnectionService;

    service = new PortForwardService(mockConfigManagementService, mockForwardingConnectionService);
    service.onForwardsChange(onForwardsChange);
    vi.mocked(randomUUID).mockReturnValue('fake-id' as UUID);
  });

  test('should create a forward configuration', async () => {
    vi.mocked(mockConfigManagementService.listForwards).mockReturnValue([]);
    const forward = sampleForwardConfig.forward;
    expect(forward).toBeDefined();

    const result = await service.createForward({
      name: sampleForwardConfig.name,
      kind: sampleForwardConfig.kind,
      namespace: sampleForwardConfig.namespace,
      forward: forward,
    });
    expect(result).toEqual(sampleForwardConfig);
    expect(mockConfigManagementService.createForward).toHaveBeenCalledWith(sampleForwardConfig);
    expect(onForwardsChange).toHaveBeenCalled();
  });

  test('should delete a forward configuration', async () => {
    await service.deleteForward(sampleForwardConfig);
    expect(mockConfigManagementService.deleteForward).toHaveBeenCalledWith(sampleForwardConfig);
    expect(onForwardsChange).toHaveBeenCalled();
  });

  test('should list all forward configurations', async () => {
    const result = service.listForwards();
    expect(result).toEqual([sampleForwardConfig]);
    expect(mockConfigManagementService.listForwards).toHaveBeenCalled();
  });

  test('should dispose for a given configuration', async () => {
    const disposeMock = vi.fn();
    vi.mocked(mockForwardingConnectionService.startForward).mockResolvedValue({
      dispose: disposeMock,
    });

    const disposable = await service.startForward(sampleForwardConfig);
    expect(disposable).toHaveProperty('dispose');

    service.dispose();
    expect(disposeMock).toHaveBeenCalled();
  });
});
