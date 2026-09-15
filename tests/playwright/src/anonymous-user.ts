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
    playExpect(fs.existsSync(kubeConfigPathDst)).toBeTruthy();
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

  test('go to replicaSets page', async () => {
    const replicaSetsPage = await navigation.openTabPage(KubernetesResources.ReplicaSets);
    await playExpect(replicaSetsPage.heading).toBeVisible();
    await playExpect.poll(async () => replicaSetsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to daemonSets page', async () => {
    const daemonSetsPage = await navigation.openTabPage(KubernetesResources.DaemonSets);
    await playExpect(daemonSetsPage.heading).toBeVisible();
    await playExpect.poll(async () => daemonSetsPage.isEmpty('Not accessible')).toBeTruthy();
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

  test('go to endpoints page', async () => {
    const endpointsPage = await navigation.openTabPage(KubernetesResources.Endpoints);
    await playExpect(endpointsPage.heading).toBeVisible();
    await playExpect.poll(async () => endpointsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to endpoint slices page', async () => {
    const endpointSlicesPage = await navigation.openTabPage(KubernetesResources.EndpointSlices);
    await playExpect(endpointSlicesPage.heading).toBeVisible();
    await playExpect.poll(async () => endpointSlicesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to network policies page', async () => {
    const networkPoliciesPage = await navigation.openTabPage(KubernetesResources.NetworkPolicies);
    await playExpect(networkPoliciesPage.heading).toBeVisible();
    await playExpect.poll(async () => networkPoliciesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to ingress classes page', async () => {
    const ingressClassesPage = await navigation.openTabPage(KubernetesResources.IngressClasses);
    await playExpect(ingressClassesPage.heading).toBeVisible();
    await playExpect.poll(async () => ingressClassesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to httproutes page', async () => {
    const httpRoutesPage = await navigation.openTabPage(KubernetesResources.HTTPRoutes);
    await playExpect(httpRoutesPage.heading).toBeVisible();
    await playExpect.poll(async () => httpRoutesPage.isEmpty('Not accessible'), { timeout: 15_000 }).toBeTruthy();
  });

  test('go to gateway classes page', async () => {
    const gatewayClassesPage = await navigation.openTabPage(KubernetesResources.GatewayClasses);
    await playExpect(gatewayClassesPage.heading).toBeVisible();
    await playExpect.poll(async () => gatewayClassesPage.isEmpty('Not accessible'), { timeout: 15_000 }).toBeTruthy();
  });

  test('go to gateways page', async () => {
    const gatewaysPage = await navigation.openTabPage(KubernetesResources.Gateways);
    await playExpect(gatewaysPage.heading).toBeVisible();
    await playExpect.poll(async () => gatewaysPage.isEmpty('Not accessible'), { timeout: 15_000 }).toBeTruthy();
  });

  test('go to pvc page', async () => {
    const pvcPage = await navigation.openTabPage(KubernetesResources.PVCs);
    await playExpect(pvcPage.heading).toBeVisible();
    await playExpect.poll(async () => pvcPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to persistent volumes page', async () => {
    const pvPage = await navigation.openTabPage(KubernetesResources.PersistentVolumes);
    await playExpect(pvPage.heading).toBeVisible();
    await playExpect.poll(async () => pvPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to storage classes page', async () => {
    const storageClassesPage = await navigation.openTabPage(KubernetesResources.StorageClasses);
    await playExpect(storageClassesPage.heading).toBeVisible();
    await playExpect.poll(async () => storageClassesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to serviceAccounts page', async () => {
    const serviceAccountsPage = await navigation.openTabPage(KubernetesResources.ServiceAccounts);
    await playExpect(serviceAccountsPage.heading).toBeVisible();
    await playExpect.poll(async () => serviceAccountsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to validatingWebhooks page', async () => {
    const validatingWebhooksPage = await navigation.openTabPage(KubernetesResources.ValidatingWebhookConfigs);
    await playExpect(validatingWebhooksPage.heading).toBeVisible();
    await playExpect.poll(async () => validatingWebhooksPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to hpas page', async () => {
    const hpasPage = await navigation.openTabPage(KubernetesResources.HorizontalPodAutoscalers);
    await playExpect(hpasPage.heading).toBeVisible();
    await playExpect.poll(async () => hpasPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to mutatingWebhooks page', async () => {
    const mutatingWebhooksPage = await navigation.openTabPage(KubernetesResources.MutatingWebhookConfigs);
    await playExpect(mutatingWebhooksPage.heading).toBeVisible();
    await playExpect.poll(async () => mutatingWebhooksPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to leases page', async () => {
    const leasesPage = await navigation.openTabPage(KubernetesResources.Leases);
    await playExpect(leasesPage.heading).toBeVisible();
    await playExpect.poll(async () => leasesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to runtimeClasses page', async () => {
    const runtimeClassesPage = await navigation.openTabPage(KubernetesResources.RuntimeClasses);
    await playExpect(runtimeClassesPage.heading).toBeVisible();
    await playExpect.poll(async () => runtimeClassesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to priorityClasses page', async () => {
    const priorityClassesPage = await navigation.openTabPage(KubernetesResources.PriorityClasses);
    await playExpect(priorityClassesPage.heading).toBeVisible();
    await playExpect.poll(async () => priorityClassesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to pdbs page', async () => {
    const pdbsPage = await navigation.openTabPage(KubernetesResources.PodDisruptionBudgets);
    await playExpect(pdbsPage.heading).toBeVisible();
    await playExpect.poll(async () => pdbsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to limitRanges page', async () => {
    const limitRangesPage = await navigation.openTabPage(KubernetesResources.LimitRanges);
    await playExpect(limitRangesPage.heading).toBeVisible();
    await playExpect.poll(async () => limitRangesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to resourceQuotas page', async () => {
    const resourceQuotasPage = await navigation.openTabPage(KubernetesResources.ResourceQuotas);
    await playExpect(resourceQuotasPage.heading).toBeVisible();
    await playExpect.poll(async () => resourceQuotasPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to clusterRoleBindings page', async () => {
    const clusterRoleBindingsPage = await navigation.openTabPage(KubernetesResources.ClusterRoleBindings);
    await playExpect(clusterRoleBindingsPage.heading).toBeVisible();
    await playExpect.poll(async () => clusterRoleBindingsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to clusterRoles page', async () => {
    const clusterRolesPage = await navigation.openTabPage(KubernetesResources.ClusterRoles);
    await playExpect(clusterRolesPage.heading).toBeVisible();
    await playExpect.poll(async () => clusterRolesPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to roleBindings page', async () => {
    const roleBindingsPage = await navigation.openTabPage(KubernetesResources.RoleBindings);
    await playExpect(roleBindingsPage.heading).toBeVisible();
    await playExpect.poll(async () => roleBindingsPage.isEmpty('Not accessible')).toBeTruthy();
  });

  test('go to roles page', async () => {
    const rolesPage = await navigation.openTabPage(KubernetesResources.Roles);
    await playExpect(rolesPage.heading).toBeVisible();
    await playExpect.poll(async () => rolesPage.isEmpty('Not accessible')).toBeTruthy();
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
