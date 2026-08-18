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

import type { V2HorizontalPodAutoscaler } from '@kubernetes/client-node';

import type { HpaUI } from './HpaUI';

export class HpaHelper {
  getHpaUI(hpa: V2HorizontalPodAutoscaler): HpaUI {
    const specMetrics = hpa.spec?.metrics ?? [];
    const currentMetrics = hpa.status?.currentMetrics ?? [];

    const metrics = specMetrics
      .map(metric => {
        if (metric.type === 'Resource') {
          const name = metric.resource?.name ?? '';
          const targetUtil = metric.resource?.target?.averageUtilization;
          const currentMetric = currentMetrics.find(cm => cm.type === 'Resource' && cm.resource?.name === name);
          const currentUtil = currentMetric?.resource?.current?.averageUtilization;
          const currentStr = currentUtil !== undefined ? `${String(currentUtil)}%` : '<unknown>';
          const targetStr = targetUtil !== undefined ? `${String(targetUtil)}%` : '<unknown>';
          return `${name}: ${currentStr}/${targetStr}`;
        }
        if (metric.type === 'Pods') {
          return metric.pods?.metric?.name ?? 'Pods';
        }
        if (metric.type === 'Object') {
          return metric.object?.metric?.name ?? 'Object';
        }
        if (metric.type === 'External') {
          return metric.external?.metric?.name ?? 'External';
        }
        return '';
      })
      .filter(name => name !== '')
      .join(', ');

    return {
      kind: 'HorizontalPodAutoscaler',
      uid: hpa.metadata?.uid ?? '',
      name: hpa.metadata?.name ?? '',
      status: 'RUNNING',
      namespace: hpa.metadata?.namespace ?? '',
      created: hpa.metadata?.creationTimestamp,
      selected: false,
      metrics: metrics || 'N/A',
      minReplicas: hpa.spec?.minReplicas ?? 1,
      maxReplicas: hpa.spec?.maxReplicas ?? 0,
      currentReplicas: hpa.status?.currentReplicas ?? 0,
      desiredReplicas: hpa.status?.desiredReplicas ?? 0,
    };
  }
}
