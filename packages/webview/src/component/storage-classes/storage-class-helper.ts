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

import type { KubernetesObject, V1StorageClass } from '@kubernetes/client-node';

import type { StorageClassUI } from './StorageClassUI';

export class StorageClassHelper {
  getStorageClassUI(o: KubernetesObject): StorageClassUI {
    const obj = o as V1StorageClass;
    return {
      kind: 'StorageClass',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status: 'RUNNING',
      created: obj.metadata?.creationTimestamp,
      provisioner: obj.provisioner ?? '',
      reclaimPolicy: obj.reclaimPolicy ?? '',
      isDefault:
        obj.metadata?.annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true' ? 'true' : 'false',
      volumeBindingMode: obj.volumeBindingMode ?? '',
    };
  }
}
