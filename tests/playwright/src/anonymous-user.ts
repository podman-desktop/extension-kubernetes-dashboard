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

import { expect as playExpect, test } from '@podman-desktop/tests-playwright';
import { handleWebview } from './utils/webviewHandler';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { KubernetesBar } from './model/pages/navigation';
import { KubernetesResources } from './model/core/types';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function anonymousUserTests(): void {
  let navigation: KubernetesBar;

  test('Update kubeconfig file with anonymous user1', async () => {
    // copy user1 kubeconfig file to the expected location
    const kubeConfigPathSrc = path.resolve(__dirname, '..', '..', 'resources', 'envtest-kubeconfig-user1');
    const kubeConfigPathDst = path.resolve(__dirname, '..', 'tests', 'playwright', 'resources', 'kube-config');
    fs.mkdirSync(path.dirname(kubeConfigPathDst), { recursive: true });
    fs.copyFileSync(kubeConfigPathSrc, kubeConfigPathDst);
  });

  test('Open Extension webview and verify the dashboard is connected', async ({ runner, page, navigationBar }) => {
    // open the webview
    const [, webview] = await handleWebview(runner, page, navigationBar);

    navigation = new KubernetesBar(webview);
    await playExpect(navigation.title).toBeVisible();

    const dashboardPage = await navigation.openKubernetesDashboardPage();
    const status = await dashboardPage.getStatus();
    playExpect(status).toContain('Connected');

    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Nodes)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Namespaces)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Deployments)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Pods)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Services)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.IngressesRoutes)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.PVCs)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.ConfigMapsSecrets)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Jobs)).toBeTruthy();
    await playExpect.poll(async () => dashboardPage.isUnauthorized(KubernetesResources.Cronjobs)).toBeTruthy();
  });

  test('go to nodes page', async () => {
    const nodesPage = await navigation.openTabPage(KubernetesResources.Nodes);
    await playExpect(nodesPage.heading).toBeVisible();
    await playExpect.poll(async () => nodesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to namespaces page', async () => {
    const namespacesPage = await navigation.openTabPage(KubernetesResources.Namespaces);
    await playExpect(namespacesPage.heading).toBeVisible();
    await playExpect.poll(async () => namespacesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to deployments page', async () => {
    const deploymentsPage = await navigation.openTabPage(KubernetesResources.Deployments);
    await playExpect(deploymentsPage.heading).toBeVisible();
    await playExpect.poll(async () => deploymentsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to pods page', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();
    await playExpect.poll(async () => podsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to services page', async () => {
    const servicesPage = await navigation.openTabPage(KubernetesResources.Services);
    await playExpect(servicesPage.heading).toBeVisible();
    await playExpect.poll(async () => servicesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to ingresses & routes page', async () => {
    const ingresssRoutesPage = await navigation.openTabPage(KubernetesResources.IngressesRoutes);
    await playExpect(ingresssRoutesPage.heading).toBeVisible();
    await playExpect.poll(async () => ingresssRoutesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to pvc page', async () => {
    const pvcPage = await navigation.openTabPage(KubernetesResources.PVCs);
    await playExpect(pvcPage.heading).toBeVisible();
    await playExpect.poll(async () => pvcPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to configmaps & secrets page', async () => {
    const configMapsSecretsPage = await navigation.openTabPage(KubernetesResources.ConfigMapsSecrets);
    await playExpect(configMapsSecretsPage.heading).toBeVisible();
    await playExpect.poll(async () => configMapsSecretsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to jobs page', async () => {
    const jobsPage = await navigation.openTabPage(KubernetesResources.Jobs);
    await playExpect(jobsPage.heading).toBeVisible();
    await playExpect.poll(async () => jobsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to cronjobs page', async () => {
    const cronjobsPage = await navigation.openTabPage(KubernetesResources.Cronjobs);
    await playExpect(cronjobsPage.heading).toBeVisible();
    await playExpect.poll(async () => cronjobsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to port forwarding page', async () => {
    const portForwardingPage = await navigation.openPortForwardingPage();
    await playExpect(portForwardingPage.heading).toBeVisible();
    await playExpect.poll(async () => portForwardingPage.isEmpty('No port forwarding configured')).toBeTruthy();
  });
}
