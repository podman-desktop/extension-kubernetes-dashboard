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

import type { V1PodDisruptionBudget } from '@kubernetes/client-node';

import type { PdbUI } from './PdbUI';

export class PdbHelper {
  getPdbUI(pdb: V1PodDisruptionBudget): PdbUI {
    return {
      kind: 'PodDisruptionBudget',
      uid: pdb.metadata?.uid ?? '',
      name: pdb.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: pdb.metadata?.namespace ?? '',
      created: pdb.metadata?.creationTimestamp,
      selected: false,
      minAvailable: String(pdb.spec?.minAvailable ?? 'N/A'),
      maxUnavailable: String(pdb.spec?.maxUnavailable ?? 'N/A'),
      currentHealthy: pdb.status?.currentHealthy ?? 0,
      desiredHealthy: pdb.status?.desiredHealthy ?? 0,
      allowedDisruptions: pdb.status?.disruptionsAllowed ?? 0,
      expectedPods: pdb.status?.expectedPods ?? 0,
    };
  }
}
