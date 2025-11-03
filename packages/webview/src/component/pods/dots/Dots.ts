/**********************************************************************
 * Copyright (C) 2023-2025 Red Hat, Inc.
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

import type { PodInfoContainerUI } from '/@/component/pods/PodUI';

const allStatuses = ['running', 'created', 'paused', 'waiting', 'degraded', 'exited', 'stopped', 'terminated', 'dead'];

// All the possible statuses that will appear for both Pods and Kubernetes
// NOTE: See: https://tailwindcss.com/docs/content-configuration#dynamic-class-names
// we cannot do "partial" names like referencing 'bg-'+status because it will
// not be shown due to how svelte handles dynamic class names
export function getStatusColor(status: string): string {
  // Define the mapping directly with Record
  // must be either "bg-" or "outline-" for either solid / outline colors
  const colors: Record<string, string> = {
    // Podman & Kubernetes
    running: 'bg-(--pd-status-running)',

    // Kubernetes-only
    terminated: 'bg-(--pd-status-terminated)',
    waiting: 'bg-(--pd-status-waiting)',

    // Podman-only
    stopped: 'outline-(--pd-status-stopped)',
    paused: 'bg-(--pd-status-paused)',
    exited: 'outline-(--pd-status-exited)',
    dead: 'bg-(--pd-status-dead)',
    created: 'outline-(--pd-status-created)',
    degraded: 'bg-(--pd-status-degraded)',
  };

  // Return the corresponding color class or a default if not found
  return colors[status] || 'bg-(--pd-status-unknown)';
}

// Organize the containers by returning their status as the key + an array of containers by order of
// highest importance (running) to lowest (dead)
export function organizeContainers(containers: PodInfoContainerUI[]): Record<string, PodInfoContainerUI[]> {
  const organizedContainers: Record<string, PodInfoContainerUI[]> = {
    running: [],
    created: [],
    paused: [],
    waiting: [],
    degraded: [],
    exited: [],
    stopped: [],
    terminated: [],
    dead: [],
  };

  containers.forEach(container => {
    const statusKey = container.Status.toLowerCase();
    if (!organizedContainers[statusKey]) {
      organizedContainers[statusKey] = [container];
    } else {
      organizedContainers[statusKey].push(container);
    }
  });

  allStatuses.forEach(status => {
    organizedContainers[status] = organizedContainers[status] || [];
  });

  return organizedContainers;
}
