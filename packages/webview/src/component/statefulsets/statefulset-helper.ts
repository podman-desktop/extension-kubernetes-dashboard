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

import type { KubernetesObject, V1StatefulSet } from '@kubernetes/client-node';
import { injectable } from 'inversify';

import type { StatefulSetUI } from './StatefulSetUI';

@injectable()
export class StatefulSetHelper {
  getStatefulSetUI(o: KubernetesObject): StatefulSetUI {
    const obj = o as V1StatefulSet;
    const replicas = obj.spec?.replicas ?? 0;
    const ready = obj.status?.readyReplicas ?? 0;

    let status = 'STOPPED';
    if (replicas > 0) {
      status = ready === replicas ? 'RUNNING' : 'DEGRADED';
    }

    return {
      kind: 'StatefulSet',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status,
      namespace: obj.metadata?.namespace ?? '',
      created: obj.metadata?.creationTimestamp,
      selected: false,
      replicas,
      ready,
      upToDate: obj.status?.updatedReplicas ?? 0,
    };
  }
}
