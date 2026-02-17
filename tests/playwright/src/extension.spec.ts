/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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
import {
  expect as playExpect,
  test,
  RunnerOptions,
  PreferencesPage,
  StatusBar,
  KubernetesResourceState,
} from '@podman-desktop/tests-playwright';
import { KubernetesDashboardDetailsPage } from './model/pages/kd-details-page';
import { handleWebview } from './utils/webviewHandler';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import { KubernetesBar } from './model/pages/navigation';
import { KubernetesResources } from './model/core/types';
import { createKubernetesResource } from '/@/utility/kubernetes';

const EXTENSION_OCI_IMAGE =
  process.env.EXTENSION_OCI_IMAGE ?? 'ghcr.io/podman-desktop/podman-desktop-extension-kubernetes-dashboard:latest';
const EXTENSION_PREINSTALLED: boolean = process.env.EXTENSION_PREINSTALLED === 'true';
const CATALOG_EXTENSION_LABEL: string = 'podman-desktop.kubernetes-dashboard';
const CATALOG_EXTENSION_NAME: string = 'Kubernetes Dashboard';
const CATALOG_STATUS_ACTIVE: string = 'ACTIVE';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

test.describe.serial(`Extension installation and verification`, { tag: '@integration' }, () => {
  test.skip(EXTENSION_PREINSTALLED, 'Extension is preinstalled');
  test.describe.serial(`Extension installation`, () => {
    let extensionsPage: ExtensionsPage;

    test(`Open Settings -> Extensions page`, async ({ navigationBar }) => {
      const dashboardPage = await navigationBar.openDashboard();
      await playExpect(dashboardPage.mainPage).toBeVisible();
      extensionsPage = await navigationBar.openExtensions();
      await playExpect(extensionsPage.header).toBeVisible();
    });

    test(`Install extension`, async () => {
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

test.describe.serial(`Extension usage`, { tag: '@integration' }, () => {
  let navigation: KubernetesBar;

  test('Load kubeconfig file in Preferences for an empty envtest cluster', async ({ page, navigationBar }) => {
    // copy testing kubeconfig file to the expected location
    const kubeConfigPathSrc = path.resolve(__dirname, '..', '..', 'resources', 'envtest-kubeconfig');
    const kubeConfigPathDst = path.resolve(__dirname, '..', 'tests', 'playwright', 'resources', 'kube-config');
    fs.mkdirSync(path.dirname(kubeConfigPathDst), { recursive: true });
    fs.copyFileSync(kubeConfigPathSrc, kubeConfigPathDst);

    // open preferences page
    const settingsBar = await navigationBar.openSettings();
    await settingsBar.expandPreferencesTab();
    const preferencesPage = await settingsBar.openTabPage(PreferencesPage);
    await playExpect(preferencesPage.heading).toBeVisible();

    await preferencesPage.selectKubeFile(kubeConfigPathDst);

    const statusbar = new StatusBar(page);
    await statusbar.validateKubernetesContext('envtest');
  });

  test('Open Extension webview and verify the dashboard is connected', async ({ runner, page, navigationBar }) => {
    // open the webview
    const [, webview] = await handleWebview(runner, page, navigationBar);

    navigation = new KubernetesBar(webview);
    await playExpect(navigation.title).toBeVisible();

    const dashboardPage = await navigation.openKubernetesDashboardPage();
    const status = await dashboardPage.getStatus();
    playExpect(status).toContain('Connected');
  });

  test('go to nodes page', async () => {
    const nodesPage = await navigation.openTabPage(KubernetesResources.Nodes);
    await playExpect(nodesPage.heading).toBeVisible();
  });

  test('go to namespaces page', async () => {
    const namespacesPage = await navigation.openTabPage(KubernetesResources.Namespaces);
    await playExpect(namespacesPage.heading).toBeVisible();
  });

  test('go to deployments page', async () => {
    const deploymentsPage = await navigation.openTabPage(KubernetesResources.Deployments);
    await playExpect(deploymentsPage.heading).toBeVisible();
  });

  test('go to pods page', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();
  });

  test('go to services page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();
  });

  test('go to ingresses & routes page', async () => {
    const ingresssRoutesPage = await navigation.openTabPage(KubernetesResources.IngressesRoutes);
    await playExpect(ingresssRoutesPage.heading).toBeVisible();
  });

  test('go to pvc page', async () => {
    const pvcPage = await navigation.openTabPage(KubernetesResources.PVCs);
    await playExpect(pvcPage.heading).toBeVisible();
  });

  test('go to configmaps & secrets page', async () => {
    const configMapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configMapsSecretsPage.heading).toBeVisible();
  });

  test('go to jobs page', async () => {
    const jobsPage = await navigation.openTabPage(KubernetesResources.Jobs);
    await playExpect(jobsPage.heading).toBeVisible();
  });

  test('go to cronjobs page', async () => {
    const cronjobsPage = await navigation.openTabPage(KubernetesResources.Cronjobs);
    await playExpect(cronjobsPage.heading).toBeVisible();
  });

  test('go to port forwarding page', async () => {
    const portForwardingPage = await navigation.openPortForwardingPage();
    await playExpect(portForwardingPage.heading).toBeVisible();
  });
});

test.describe.serial('With resources', { tag: '@integration' }, () => {
  let navigation: KubernetesBar;

  test('deploy resources to cluster', async () => {
    const kubeConfigPathDst = path.resolve(__dirname, '..', 'tests', 'playwright', 'resources', 'kube-config');
    process.env.KUBECONFIG = kubeConfigPathDst;
    const yamlPath = path.resolve(__dirname, '..', '..', 'resources', 'cluster-resources.yaml');
    await createKubernetesResource(yamlPath);
  });

  test('Open Extension webview and verify the dashboard is connected and resources metrics are correct', async ({
    runner,
    page,
    navigationBar,
  }) => {
    // open the webview
    const [, webview] = await handleWebview(runner, page, navigationBar);

    navigation = new KubernetesBar(webview);
    await playExpect(navigation.title).toBeVisible();

    const dashboardPage = await navigation.openKubernetesDashboardPage();
    const status = await dashboardPage.getStatus();
    playExpect(status).toContain('Connected');
    await playExpect
      .poll(async () => dashboardPage.getCurrentActiveCountForResource(KubernetesResources.Nodes))
      .toBe(2);
    await playExpect.poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Nodes)).toBe(2);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Namespaces))
      .toBe(4);
    await playExpect
      .poll(async () => dashboardPage.getCurrentActiveCountForResource(KubernetesResources.Deployments))
      .toBe(2);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Deployments))
      .toBe(2);
    await playExpect.poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Pods)).toBe(2);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Services))
      .toBe(5);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.IngressesRoutes))
      .toBe(1);
    await playExpect.poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.PVCs)).toBe(1);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.ConfigMapsSecrets))
      .toBe(4);
    await playExpect.poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Jobs)).toBe(1);
    await playExpect
      .poll(async () => dashboardPage.getCurrentTotalCountForResource(KubernetesResources.Cronjobs))
      .toBe(1);
  });

  test('go to node1 page', async () => {
    const nodesPage = await navigation.openTabPage(KubernetesResources.Nodes);
    await playExpect(nodesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await nodesPage.openResourceDetails('node1', KubernetesResources.Nodes);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to node2 page', async () => {
    const nodesPage = await navigation.openTabPage(KubernetesResources.Nodes);
    await playExpect(nodesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await nodesPage.openResourceDetails('node2', KubernetesResources.Nodes);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to default namespace page', async () => {
    const namespacesPage = await navigation.openTabPage(KubernetesResources.Namespaces);
    await playExpect(namespacesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await namespacesPage.openResourceDetails(
      'default',
      KubernetesResources.Namespaces,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to deploy1 page', async () => {
    const deploymentsPage = await navigation.openTabPage(KubernetesResources.Deployments);
    await playExpect(deploymentsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await deploymentsPage.openResourceDetails(
      'deploy1',
      KubernetesResources.Deployments,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Stopped);
  });

  test('go to deploy2 page', async () => {
    const deploymentsPage = await navigation.openTabPage(KubernetesResources.Deployments);
    await playExpect(deploymentsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await deploymentsPage.openResourceDetails(
      'deploy2',
      KubernetesResources.Deployments,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Stopped);
  });

  test('go to pod1 page', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await podsPage.openResourceDetails('pod1', KubernetesResources.Pods);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe('PENDING');
  });

  test('go to pod2 page', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await podsPage.openResourceDetails('pod2', KubernetesResources.Pods);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe('PENDING');
  });

  test('go to svc1-clusterip page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await servicesPage.openResourceDetails(
      'svc1-clusterip',
      KubernetesResources.Services,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to svc2-externalname page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await servicesPage.openResourceDetails(
      'svc2-externalname',
      KubernetesResources.Services,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to svc3-loadbalancer page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await servicesPage.openResourceDetails(
      'svc3-loadbalancer',
      KubernetesResources.Services,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to svc4-nodeport page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await servicesPage.openResourceDetails(
      'svc4-nodeport',
      KubernetesResources.Services,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to ingress1 page', async () => {
    const ingressesRoutesPage = await navigation.openTabPage(KubernetesResources.IngressesRoutes);
    await playExpect(ingressesRoutesPage.heading).toBeVisible();

    const kubernetesResourceDetails = await ingressesRoutesPage.openResourceDetails(
      'ingress1',
      KubernetesResources.IngressesRoutes,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to configmap1 page', async () => {
    const configmapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configmapsSecretsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await configmapsSecretsPage.openResourceDetails(
      'configmap1',
      KubernetesResources.ConfigMapsSecrets,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to secret1-generic page', async () => {
    const configmapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configmapsSecretsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await configmapsSecretsPage.openResourceDetails(
      'secret1-generic',
      KubernetesResources.ConfigMapsSecrets,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to secret2-docker-registry page', async () => {
    const configmapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configmapsSecretsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await configmapsSecretsPage.openResourceDetails(
      'secret2-docker-registry',
      KubernetesResources.ConfigMapsSecrets,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to secret3-tls page', async () => {
    const configmapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configmapsSecretsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await configmapsSecretsPage.openResourceDetails(
      'secret3-tls',
      KubernetesResources.ConfigMapsSecrets,
    );
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });

  test('go to job1 page', async () => {
    const jobsPage = await navigation.openTabPage(KubernetesResources.Jobs);
    await playExpect(jobsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await jobsPage.openResourceDetails('job1', KubernetesResources.Jobs);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Starting);
  });

  test('go to cronjob1 page', async () => {
    const cronjobsPage = await navigation.openTabPage(KubernetesResources.Cronjobs);
    await playExpect(cronjobsPage.heading).toBeVisible();

    const kubernetesResourceDetails = await cronjobsPage.openResourceDetails('cronjob1', KubernetesResources.Cronjobs);
    await playExpect(kubernetesResourceDetails.heading).toBeVisible();
    await playExpect.poll(async () => kubernetesResourceDetails.getState()).toBe(KubernetesResourceState.Running);
  });
});
