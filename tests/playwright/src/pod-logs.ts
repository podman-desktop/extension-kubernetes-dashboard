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

const INITIAL_LOG = 'Log line 1: Hello from pod1';

export function podLogsTests(): void {
  let navigation: KubernetesBar;

  test('Patch pod1 status and inject initial log', async () => {
    await patchPodStatus('pod1');
    await injectFakeLogs('default', 'pod1', 'pod1', [INITIAL_LOG]);
  });

  test('Open webview and verify dashboard is connected', async ({ runner, page, navigationBar }) => {
    const [, webview] = await handleWebview(runner, page, navigationBar);

    navigation = new KubernetesBar(webview);
    await playExpect(navigation.title).toBeVisible();

    const dashboardPage = await navigation.openKubernetesDashboardPage();
    const status = await dashboardPage.getStatus();
    playExpect(status).toContain('Connected');
  });

  test('Navigate to pod1 logs and verify initial log line', async () => {
    const podsPage = await navigation.openTabPage(KubernetesResources.Pods);
    await playExpect(podsPage.heading).toBeVisible();

    const detailsPage = await podsPage.openResourceDetails('pod1', KubernetesResources.Pods);
    await playExpect(detailsPage.heading).toBeVisible();

    const logsTab = navigation.page.getByRole('link', { name: 'Logs' });
    await logsTab.click();

    const terminal = navigation.page.getByRole('term');
    await playExpect(terminal).toBeVisible();
    await playExpect(terminal).toContainText(INITIAL_LOG, { timeout: 10_000 });
  });
}
