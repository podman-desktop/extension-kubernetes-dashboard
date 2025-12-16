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

import type { ExtensionsPage } from '@podman-desktop/tests-playwright';
import { expect as playExpect, test, RunnerOptions } from '@podman-desktop/tests-playwright';
import { KubernetesDashboardDetailsPage } from './model/kd-details-page';

const EXTENSION_OCI_IMAGE =
  process.env.EXTENSION_OCI_IMAGE ?? 'ghcr.io/podman-desktop/podman-desktop-extension-kubernetes-dashboard:latest';
const EXTENSION_PREINSTALLED: boolean = process.env.EXTENSION_PREINSTALLED === 'true';
const CATALOG_EXTENSION_LABEL: string = 'redhat.kubernetes-dashboard';
const CATALOG_EXTENSION_NAME: string = 'Kubernetes Dashboard';
const CATALOG_STATUS_ACTIVE: string = 'ACTIVE';

test.use({
  runnerOptions: new RunnerOptions({
    customFolder: 'kubernetes-dashboard-tests',
    /**
     * For performance reasons, disable extensions which are not necessary for the e2e
     */
    customSettings: {
      'extensions.disabled': [
        'podman-desktop.compose',
        'podman-desktop.docker',
        'podman-desktop.kind',
        'podman-desktop.kube-context',
        'podman-desktop.kubectl-cli',
        'podman-desktop.lima',
        'podman-desktop.minikube',
        'podman-desktop.registries',
      ],
    },
  }),
});

test.beforeAll(async ({ runner, welcomePage }) => {
  test.setTimeout(80_000);

  runner.setVideoAndTraceName('kubernetes-dashboard-e2e');
  await welcomePage.handleWelcomePage(true);
});

test.afterAll(async ({ runner }) => {
  test.setTimeout(200_000);
  await runner.close();
});

test.describe.serial(`Extension installation and verification`, { tag: '@smoke' }, () => {
  test.describe.serial(`Extension installation`, () => {
    let extensionsPage: ExtensionsPage;

    test(`Open Settings -> Extensions page`, async ({ navigationBar }) => {
      const dashboardPage = await navigationBar.openDashboard();
      await playExpect(dashboardPage.mainPage).toBeVisible();
      extensionsPage = await navigationBar.openExtensions();
      await playExpect(extensionsPage.header).toBeVisible();
    });

    test(`Install extension`, async () => {
      test.skip(EXTENSION_PREINSTALLED, 'Extension is preinstalled');
      await extensionsPage.installExtensionFromOCIImage(EXTENSION_OCI_IMAGE);
    });

    test('Extension (card) is installed, present and active', async ({ navigationBar }) => {
      const extensions = await navigationBar.openExtensions();
      await playExpect
        .poll(async () => await extensions.extensionIsInstalled(CATALOG_EXTENSION_LABEL), {
          timeout: 30000,
        })
        .toBeTruthy();
      const extensionCard = await extensions.getInstalledExtension(CATALOG_EXTENSION_NAME, CATALOG_EXTENSION_LABEL);
      await playExpect(extensionCard.status).toHaveText(CATALOG_STATUS_ACTIVE);
    });

    test(`Extension's details show correct status, no error`, async ({ page, navigationBar }) => {
      const extensions = await navigationBar.openExtensions();
      const extensionCard = await extensions.getInstalledExtension('kubernetes-dashboard', CATALOG_EXTENSION_LABEL);
      await extensionCard.openExtensionDetails(CATALOG_EXTENSION_NAME);
      const details = new KubernetesDashboardDetailsPage(page);
      await playExpect(details.heading).toBeVisible();
      await playExpect(details.status).toHaveText(CATALOG_STATUS_ACTIVE);
      const errorTab = details.tabs.getByRole('button', { name: 'Error' });
      // we would like to propagate the error's stack trace into test failure message
      let stackTrace = '';
      if ((await errorTab.count()) > 0) {
        await details.activateTab('Error');
        stackTrace = await details.errorStackTrace.innerText();
      }
      await playExpect(errorTab, `Error Tab was present with stackTrace: ${stackTrace}`).not.toBeVisible();
    });
  });
});
