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

export enum NavSection {
  Compute = 'Compute',
  Config = 'Config',
  Network = 'Network',
  Storage = 'Storage',
}

export enum KubernetesResources {
  Namespaces = 'Namespaces',
  Nodes = 'Nodes',
  Deployments = 'Deployments',
  DaemonSets = 'DaemonSets',
  StatefulSets = 'StatefulSets',
  ReplicaSets = 'ReplicaSets',
  Services = 'Services',
  IngressesRoutes = 'Ingresses & Routes',
  EndpointSlices = 'Endpoint Slices',
  PVCs = 'Persistent Volume Claims',
  PersistentVolumes = 'Persistent Volumes',
  StorageClasses = 'Storage Classes',
  ConfigMapsSecrets = 'ConfigMaps & Secrets',
  PortForwarding = 'Port Forwarding',
  Pods = 'Pods',
  Cronjobs = 'CronJobs',
  Jobs = 'Jobs',
}

export const KubernetesResourceAttributes: Record<KubernetesResources, string[]> = {
  [KubernetesResources.Namespaces]: ['Status', 'Name', 'Age', 'Actions'],
  [KubernetesResources.Nodes]: ['Status', 'Name', 'Roles', 'Version', 'OS', 'Kernel', 'Age'],
  [KubernetesResources.Deployments]: ['Selected', 'Status', 'Name', 'Conditions', 'Pods', 'Age', 'Actions'],
  [KubernetesResources.DaemonSets]: ['Status', 'Name', 'Ready', 'Up-to-date', 'Node Selector', 'Age'],
  [KubernetesResources.StatefulSets]: ['Selected', 'Status', 'Name', 'Replicas', 'Age', 'Actions'],
  [KubernetesResources.ReplicaSets]: ['Status', 'Name', 'Desired', 'Current', 'Ready', 'Owner', 'Age'],
  [KubernetesResources.Services]: ['Selected', 'Status', 'Name', 'Type', 'Cluster IP', 'Ports', 'Age', 'Actions'],
  [KubernetesResources.IngressesRoutes]: ['Selected', 'Status', 'Name', 'Host/Path', 'Backend', 'Age', 'Actions'],
  [KubernetesResources.EndpointSlices]: [
    'Selected',
    'Status',
    'Name',
    'Address Type',
    'Ports',
    'Endpoints',
    'Age',
    'Actions',
  ],
  [KubernetesResources.PVCs]: ['Selected', 'Status', 'Name', 'Environment', 'Age', 'Size', 'Actions'],
  [KubernetesResources.PersistentVolumes]: [
    'Selected',
    'Status',
    'Name',
    'Phase',
    'Storage Class',
    'Capacity',
    'Claim',
    'Access Modes',
    'Reclaim Policy',
    'Age',
    'Actions',
  ],
  [KubernetesResources.StorageClasses]: [
    'Status',
    'Name',
    'Provisioner',
    'Reclaim Policy',
    'Default',
    'Volume Binding Mode',
    'Age',
  ],
  [KubernetesResources.ConfigMapsSecrets]: ['Selected', 'Status', 'Name', 'Type', 'Keys', 'Age', 'Actions'],
  [KubernetesResources.PortForwarding]: ['Status', 'Name', 'Type', 'Local Port', 'Remote Port', 'Actions'],
  [KubernetesResources.Pods]: ['Selected', 'Status', 'Name', 'Containers', 'Age', 'Actions'],
  [KubernetesResources.Cronjobs]: [
    'Selected',
    'Status',
    'Name',
    'Schedule',
    'Last scheduled',
    'Suspended',
    'Active',
    'Age',
    'Actions',
  ],
  [KubernetesResources.Jobs]: ['Selected', 'Status', 'Name', 'Conditions', 'Completions', 'Age', 'Actions'],
};
