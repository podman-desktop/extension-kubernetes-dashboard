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

import type { KubernetesObject } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { StorageClassHelper } from './storage-class-helper';

let helper: StorageClassHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new StorageClassHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      uid: 'uid-1',
      name: 'standard',
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    provisioner: 'kubernetes.io/aws-ebs',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
  } as unknown as KubernetesObject;

  const ui = helper.getStorageClassUI(obj);
  expect(ui.kind).toEqual('StorageClass');
  expect(ui.name).toEqual('standard');
  expect(ui.uid).toEqual('uid-1');
  expect(ui.status).toEqual('RUNNING');
  expect(ui.provisioner).toEqual('kubernetes.io/aws-ebs');
});

test('expect reclaimPolicy and volumeBindingMode mapped', async () => {
  const obj = {
    metadata: { name: 'sc-1' },
    provisioner: 'kubernetes.io/gce-pd',
    reclaimPolicy: 'Retain',
    volumeBindingMode: 'WaitForFirstConsumer',
  } as unknown as KubernetesObject;

  const ui = helper.getStorageClassUI(obj);
  expect(ui.reclaimPolicy).toEqual('Retain');
  expect(ui.volumeBindingMode).toEqual('WaitForFirstConsumer');
});

test('expect isDefault true when annotation is true', async () => {
  const obj = {
    metadata: {
      name: 'sc-1',
      annotations: {
        'storageclass.kubernetes.io/is-default-class': 'true',
      },
    },
    provisioner: 'kubernetes.io/aws-ebs',
  } as unknown as KubernetesObject;

  const ui = helper.getStorageClassUI(obj);
  expect(ui.isDefault).toEqual('true');
});

test('expect isDefault false when annotation is missing', async () => {
  const obj = {
    metadata: { name: 'sc-1' },
    provisioner: 'kubernetes.io/aws-ebs',
  } as unknown as KubernetesObject;

  const ui = helper.getStorageClassUI(obj);
  expect(ui.isDefault).toEqual('false');
});
