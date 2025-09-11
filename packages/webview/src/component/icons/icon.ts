/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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

import type { Component } from 'svelte';

import ConfigMapSecretIcon from './ConfigMapSecretIcon.svelte';
import CronJobIcon from './CronJobIcon.svelte';
import DeploymentIcon from './DeploymentIcon.svelte';
import IngressRouteIcon from './IngressRouteIcon.svelte';
import JobIcon from './JobIcon.svelte';
import NodeIcon from './NodeIcon.svelte';
import PodIcon from './PodIcon.svelte';
import PvcIcon from './PVCIcon.svelte';
import ServiceIcon from './ServiceIcon.svelte';
import NamespaceIcon from './NamespaceIcon.svelte';

export const icon: Record<string, Component> = {
  ConfigMap: ConfigMapSecretIcon,
  Secret: ConfigMapSecretIcon,
  CronJob: CronJobIcon,
  Deployment: DeploymentIcon,
  Ingress: IngressRouteIcon,
  Route: IngressRouteIcon,
  Job: JobIcon,
  Node: NodeIcon,
  Pod: PodIcon,
  PersistentVolumeClaim: PvcIcon,
  Service: ServiceIcon,
  Namespace: NamespaceIcon,
};
