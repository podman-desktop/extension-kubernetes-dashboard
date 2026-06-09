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

import type { KubernetesObject, V1ReplicaSet } from '@kubernetes/client-node';
import { injectable } from 'inversify';

import type { ReplicaSetUI } from './ReplicaSetUI';

@injectable()
export class ReplicaSetHelper {
  getReplicaSetUI(o: KubernetesObject): ReplicaSetUI {
    const obj = o as V1ReplicaSet;
    const desired = obj.spec?.replicas ?? 0;
    const ready = obj.status?.readyReplicas ?? 0;

    let status = 'STOPPED';
    if (desired > 0) {
      status = ready === desired ? 'RUNNING' : 'DEGRADED';
    }

    return {
      kind: 'ReplicaSet',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status,
      namespace: obj.metadata?.namespace ?? '',
      created: obj.metadata?.creationTimestamp,
      selected: false,
      desired,
      current: obj.status?.replicas ?? 0,
      ready,
      owner: obj.metadata?.ownerReferences?.[0]
        ? `${obj.metadata.ownerReferences[0].kind}/${obj.metadata.ownerReferences[0].name}`
        : '',
    };
  }
}
