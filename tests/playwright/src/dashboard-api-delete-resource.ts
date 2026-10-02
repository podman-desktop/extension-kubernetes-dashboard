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

import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect as playExpect, PreferencesPage, StatusBar, test } from '@podman-desktop/tests-playwright';

import { DashboardApiClient } from './utility/dashboard-api-client';

const KUBECTL_TIMEOUT_MS = process.platform === 'win32' ? 30_000 : 10_000;
const kubeconfig = fileURLToPath(new URL('../../resources/envtest-kubeconfig', import.meta.url));
const dashboardKubeconfig = fileURLToPath(new URL('../tests/playwright/resources/kube-config', import.meta.url));

function kubectl(args: string[], input?: object): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line sonarjs/os-command
    const child = execFile(
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      'kubectl',
      ['--kubeconfig', kubeconfig, '--context', 'envtest', ...args],
      { encoding: 'utf8', timeout: KUBECTL_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      },
    );
    child.stdin?.on('error', reject);
    child.stdin?.end(input === undefined ? undefined : JSON.stringify(input));
  });
}

export function dashboardApiDeleteResourceTests(): void {
  test.describe('deleteResource', () => {
    if (process.platform === 'win32') {
      test.setTimeout(120_000);
    }

    let client: DashboardApiClient;
    let name: string;

    test.beforeAll(async ({ navigationBar, page }) => {
      await mkdir(dirname(dashboardKubeconfig), { recursive: true });
      await copyFile(kubeconfig, dashboardKubeconfig);
      const settingsBar = await navigationBar.openSettings();
      await settingsBar.expandPreferencesTab();
      const preferencesPage = await settingsBar.openTabPage(PreferencesPage);
      await preferencesPage.selectKubeFile(dashboardKubeconfig);
      await new StatusBar(page).validateKubernetesContext('envtest');

      client = await DashboardApiClient.create();
      await playExpect(async () => {
        playExpect((await client.getApiResources('v1')).groupVersion).toBe('v1');
      }).toPass({ timeout: 15_000 });
      await kubectl(['apply', '-f', '-'], {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: 'ns2' },
      });
    });

    test.beforeEach(() => {
      name = `dashboard-delete-${randomUUID()}`;
    });

    test.afterEach(async () => {
      for (const namespace of ['default', 'ns2']) {
        await kubectl(['delete', 'configmap', name, '--namespace', namespace, '--ignore-not-found', '--wait=false']);
      }
      await kubectl(['delete', 'clusterrole', name, '--ignore-not-found', '--wait=false']);
    });

    async function createConfigMaps(): Promise<void> {
      for (const namespace of ['default', 'ns2']) {
        await kubectl(['create', '-f', '-'], {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: { name, namespace },
          data: { value: 'original' },
        });
      }
    }

    test('deletes only the requested namespaced resource without a confirmation dialog', async () => {
      await createConfigMaps();

      await client.deleteResource('ConfigMap', name, 'ns2');

      await playExpect
        .poll(async () =>
          (await kubectl(['get', 'configmap', name, '--namespace', 'ns2', '--ignore-not-found', '-o', 'name'])).trim(),
        )
        .toBe('');
      playExpect((await kubectl(['get', 'configmap', name, '--namespace', 'default', '-o', 'name'])).trim()).toBe(
        `configmap/${name}`,
      );
    });

    test('defaults to the current namespace when namespace is omitted', async () => {
      await createConfigMaps();

      await client.deleteResource('ConfigMap', name);

      await playExpect
        .poll(async () =>
          (
            await kubectl(['get', 'configmap', name, '--namespace', 'default', '--ignore-not-found', '-o', 'name'])
          ).trim(),
        )
        .toBe('');
      playExpect((await kubectl(['get', 'configmap', name, '--namespace', 'ns2', '-o', 'name'])).trim()).toBe(
        `configmap/${name}`,
      );
    });

    test('deletes a cluster-scoped resource', async () => {
      await kubectl(['create', '-f', '-'], {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name },
        rules: [],
      });

      await client.deleteResource('ClusterRole', name);

      await playExpect
        .poll(async () => (await kubectl(['get', 'clusterrole', name, '--ignore-not-found', '-o', 'name'])).trim())
        .toBe('');
    });

    test('propagates ApiResourceError for a missing resource', async () => {
      await playExpect(client.deleteResource('ConfigMap', name, 'default')).rejects.toMatchObject({
        name: 'ApiResourceError',
        statusCode: 404,
        message: playExpect.stringContaining(name),
      });
    });

    test('rejects an unsupported resource kind', async () => {
      await playExpect(client.deleteResource('UnknownKind', name, 'default')).rejects.toMatchObject({
        name: 'Error',
        message: playExpect.stringContaining('no handler for kind UnknownKind'),
      });
    });
  });
}
