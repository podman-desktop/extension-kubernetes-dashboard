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

import type { V1PersistentVolume } from '@kubernetes/client-node';

import type { PvUI } from './PvUI';

export class PvHelper {
  getPvUI(obj: V1PersistentVolume): PvUI {
    const phase = obj.status?.phase ?? '';
    let status: string;
    if (phase === 'Bound' || phase === 'Available') {
      status = 'RUNNING';
    } else {
      status = 'STOPPED';
    }

    return {
      kind: 'PersistentVolume',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status,
      created: obj.metadata?.creationTimestamp,
      storageClass: obj.spec?.storageClassName ?? '',
      capacity: obj.spec?.capacity?.['storage'] ?? '',
      claim: obj.spec?.claimRef ? `${obj.spec.claimRef.namespace}/${obj.spec.claimRef.name}` : '',
      pvStatus: phase,
      accessModes: (obj.spec?.accessModes ?? []).join(', '),
      reclaimPolicy: obj.spec?.persistentVolumeReclaimPolicy ?? '',
    };
  }
}
