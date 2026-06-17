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

import type { KubernetesObject, V1DaemonSet } from '@kubernetes/client-node';
import { injectable } from 'inversify';

import type { DaemonSetUI } from './DaemonSetUI';

@injectable()
export class DaemonSetHelper {
  getDaemonSetUI(o: KubernetesObject): DaemonSetUI {
    const obj = o as V1DaemonSet;
    const desired = obj.status?.desiredNumberScheduled ?? 0;
    const ready = obj.status?.numberReady ?? 0;

    let status = 'STOPPED';
    if (desired > 0) {
      status = ready === desired ? 'RUNNING' : 'DEGRADED';
    }

    return {
      kind: 'DaemonSet',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      status,
      namespace: obj.metadata?.namespace ?? '',
      created: obj.metadata?.creationTimestamp,
      selected: false,
      desired,
      current: obj.status?.currentNumberScheduled ?? 0,
      ready,
      upToDate: obj.status?.updatedNumberScheduled ?? 0,
      available: obj.status?.numberAvailable ?? 0,
      nodeSelector: obj.spec?.template?.spec?.nodeSelector
        ? Object.entries(obj.spec.template.spec.nodeSelector)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')
        : '',
    };
  }
}
