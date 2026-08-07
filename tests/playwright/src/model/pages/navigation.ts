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

import type { Locator, Page } from '@playwright/test';
import { KubernetesResources, NavSection } from '/@/model/core/types';
import { KubernetesResourcePage } from './kubernetes-resource-page';
import { KubernetesDashboardPage } from './kubernetes-dashboard-page';
import { PortForwardingPage } from './port-forwarding-page';

// Maps each nav item to the collapsible section it lives in (undefined = top-level).
const RESOURCE_SECTION: Partial<Record<KubernetesResources, NavSection>> = {
  [KubernetesResources.Deployments]: NavSection.Compute,
  [KubernetesResources.DaemonSets]: NavSection.Compute,
  [KubernetesResources.StatefulSets]: NavSection.Compute,
  [KubernetesResources.ReplicaSets]: NavSection.Compute,
  [KubernetesResources.Pods]: NavSection.Compute,
  [KubernetesResources.Jobs]: NavSection.Compute,
  [KubernetesResources.Cronjobs]: NavSection.Compute,
  [KubernetesResources.ConfigMapsSecrets]: NavSection.Config,
  [KubernetesResources.Services]: NavSection.Network,
  [KubernetesResources.IngressesRoutes]: NavSection.Network,
  [KubernetesResources.PortForwarding]: NavSection.Network,
  [KubernetesResources.PVCs]: NavSection.Storage,
  [KubernetesResources.PersistentVolumes]: NavSection.Storage,
  [KubernetesResources.StorageClasses]: NavSection.Storage,
  [KubernetesResources.MutatingWebhookConfigs]: NavSection.Config,
};

export class KubernetesBar {
  readonly page: Page;
  readonly kubernetesNavBar: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.kubernetesNavBar = page.getByRole('navigation', { name: 'Kubernetes resources' });
    this.title = this.kubernetesNavBar.getByText('Kubernetes');
  }

  // Clicks the section header to expand it, only when the resource link is not already visible.
  private async expandSectionIfNeeded(sectionName: string, resourceLink: Locator): Promise<void> {
    if (!(await resourceLink.isVisible())) {
      const sectionLink = this.kubernetesNavBar.getByRole('link', { name: sectionName, exact: true });
      await sectionLink.click();
    }
  }

  public async openTabPage(kubernetesResource: KubernetesResources): Promise<KubernetesResourcePage> {
    const section = RESOURCE_SECTION[kubernetesResource];
    const resource = this.kubernetesNavBar.getByRole('link', { name: kubernetesResource, exact: true });

    if (section) {
      await this.expandSectionIfNeeded(section, resource);
    }

    await resource.click();

    switch (kubernetesResource) {
      case 'Persistent Volume Claims':
        return new KubernetesResourcePage(this.page, 'PVCs');
      case 'ConfigMaps & Secrets':
        return new KubernetesResourcePage(this.page, 'Configmaps and Secrets');
      case 'Ingresses & Routes':
        return new KubernetesResourcePage(this.page, 'ingresses and routes');
      case 'DaemonSets':
        return new KubernetesResourcePage(this.page, 'daemonsets');
      case 'StatefulSets':
        return new KubernetesResourcePage(this.page, 'statefulsets');
      case 'ReplicaSets':
        return new KubernetesResourcePage(this.page, 'replicasets');
      case 'Persistent Volumes':
        return new KubernetesResourcePage(this.page, 'persistent volumes');
      case 'Storage Classes':
        return new KubernetesResourcePage(this.page, 'storage classes');
      case 'Mutating Webhook Configs':
        return new KubernetesResourcePage(this.page, 'mutating webhook configurations');
      default:
        return new KubernetesResourcePage(this.page, kubernetesResource);
    }
  }

  public async openKubernetesDashboardPage(): Promise<KubernetesDashboardPage> {
    const dashboardLink = this.kubernetesNavBar.getByRole('link', { name: 'Dashboard', exact: true });
    await dashboardLink.click();
    return new KubernetesDashboardPage(this.page);
  }

  public async openPortForwardingPage(): Promise<PortForwardingPage> {
    const portForwardingLink = this.kubernetesNavBar.getByRole('link', { name: 'Port Forwarding', exact: true });
    await this.expandSectionIfNeeded(NavSection.Network, portForwardingLink);
    await portForwardingLink.click();
    return new PortForwardingPage(this.page);
  }
}
