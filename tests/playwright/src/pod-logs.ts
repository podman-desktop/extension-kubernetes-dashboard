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
import { KubernetesBar } from './model/pages/navigation';
import { KubernetesResources } from './model/core/types';
import { patchPodStatus, injectFakeLogs } from '/@/utility/fake-kubelet';

export function podLogsTests(): void {
  let navigation: KubernetesBar;

  const INITIAL_LOGS = ['Log line 1: Hello from pod1', 'Log line 2: Processing request...'];
  const STREAMED_LOG = '[INFO] New connection established';

  test('Patch pod1 status and inject initial logs', async () => {
    await patchPodStatus('pod1');
    await injectFakeLogs('default', 'pod1', 'pod1', INITIAL_LOGS);
  });

  test('Open webview and verify dashboard is connected', async ({ runner, page, navigationBar }) => {
    const [, webview] = await handleWebview(runner, page, navigationBar);

    navigation = new KubernetesBar(webview);
    await playExpect(navigation.title).toBeVisible();

    const dashboardPage = await navigation.openKubernetesDashboardPage();
    const status = await dashboardPage.getStatus();
    playExpect(status).toContain('Connected');
  });

  test('Navigate to pod1 logs and verify initial log lines', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();

    const detailsPage = await podsPage.openResourceDetails('pod1', KubernetesResources.Pods);
    await playExpect(detailsPage.heading).toBeVisible();

    const logsTab = navigation.page.getByRole('link', { name: 'Logs' });
    await logsTab.click();

    const terminal = navigation.page.getByRole('term');
    await playExpect(terminal).toBeVisible();

    for (const line of INITIAL_LOGS) {
      await playExpect(terminal).toContainText(line, { timeout: 10_000 });
    }
  });

  test('Verify streamed logs appear in realtime', async () => {
    const terminal = navigation.page.getByRole('term');

    await injectFakeLogs('default', 'pod1', 'pod1', [STREAMED_LOG]);

    await playExpect(terminal).toContainText(STREAMED_LOG, { timeout: 10_000 });
  });

  test('Navigate away from logs page', async () => {
    const summaryTab = navigation.page
      .getByRole('region', { name: 'Tabs' })
      .getByRole('link', { name: 'Summary', exact: true });
    await summaryTab.dispatchEvent('click');

    const backLink = navigation.page
      .getByRole('region', { name: 'Header' })
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Back' });
    await backLink.dispatchEvent('click');
  });
}
