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

import test, { expect as playExpect, type Locator, type Page } from '@playwright/test';

import { KubernetesResourceAttributes, KubernetesResources } from '/@/model/core/types';
import { MainPage } from '@podman-desktop/tests-playwright';
import { KubernetesResourceDetailsPage } from '/@/model/pages/kubernetes-resource-details-page';

export class KubernetesResourcePage extends MainPage {
  readonly applyYamlButton: Locator;
  readonly namespaceLocator: Locator;
  readonly namespaceDropdownButton: Locator;
  readonly currentNamespace: Locator;

  constructor(page: Page, name: string) {
    super(page, name);
    this.applyYamlButton = this.additionalActions.getByRole('button', {
      name: 'Apply YAML',
    });
    this.namespaceLocator = this.page.getByLabel('Kubernetes Namespace', { exact: true });
    this.namespaceDropdownButton = this.namespaceLocator.getByRole('button', { name: 'Namespace' });
    this.currentNamespace = this.namespaceLocator.getByLabel('hidden input', { exact: true });
  }

  async changeNamespace(name: string): Promise<void> {
    await playExpect(this.currentNamespace).not.toHaveValue(name, { timeout: 10_000 });
    await this.namespaceDropdownButton.click();
    const option = this.namespaceLocator.getByRole('button', { name, exact: true });
    await playExpect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    await playExpect(this.currentNamespace).toHaveValue(name, { timeout: 10_000 });
  }

  async fetchKubernetesResource(resourceName: string, timeout = 15_000): Promise<Locator> {
    try {
      await playExpect.poll(async () => this.getRowByName(resourceName, false), { timeout: timeout }).toBeTruthy();
    } catch {
      throw Error(`Resource: ${resourceName} does not exist`);
    }

    return (await this.getRowByName(resourceName, false)) as Locator;
  }

  async getAttributeByRow(row: Locator, attributeName: string, resourceType: KubernetesResources): Promise<Locator> {
    const attributes = KubernetesResourceAttributes[resourceType];
    const attrIndex = attributes.indexOf(attributeName) + 1;
    return row.getByRole('cell').nth(attrIndex);
  }

  async openResourceDetails(
    resourceName: string,
    resourceType: KubernetesResources,
    timeout?: number,
  ): Promise<KubernetesResourceDetailsPage> {
    return test.step(`Open ${resourceType}: ${resourceName} details`, async () => {
      const resourceRow = await this.fetchKubernetesResource(resourceName, timeout);

      let resourceRowName: Locator;
      if (resourceType === KubernetesResources.Nodes) {
        resourceRowName = resourceRow.getByRole('cell').nth(2);
      } else {
        resourceRowName = resourceRow.getByRole('cell').nth(3);
      }

      await playExpect(resourceRowName).toBeEnabled();
      await resourceRowName.click();

      return new KubernetesResourceDetailsPage(this.page, resourceName);
    });
  }

  async isEmpty(label: string): Promise<boolean> {
    const content = this.mainPage.getByRole('region', { name: 'content' });
    const heading = content.getByRole('heading', {
      name: label,
      exact: true,
    });
    return (await heading.count()) > 0;
  }
}
