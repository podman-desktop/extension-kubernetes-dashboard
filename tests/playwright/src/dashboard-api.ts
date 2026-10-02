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

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import type { PatchStrategyType } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { expect as playExpect, test } from '@podman-desktop/tests-playwright';

import { DashboardApiClient } from './utility/dashboard-api-client';

const CONTEXT_NAME = 'envtest';
const kubeconfig = fileURLToPath(new URL('../../resources/envtest-kubeconfig', import.meta.url));

function kubectl(args: string[], input?: string): string {
  // eslint-disable-next-line sonarjs/os-command
  return execFileSync(
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    'kubectl',
    ['--kubeconfig', kubeconfig, '--context', CONTEXT_NAME, '--namespace', 'default', ...args],
    {
      encoding: 'utf8',
      input,
      timeout: 10_000,
    },
  );
}

interface ConfigMapResult {
  data: Record<string, string>;
  metadata: {
    namespace: string;
    managedFields: { manager: string; operation: string; fieldsV1: Record<string, unknown> }[];
  };
}

export function dashboardApiTests(): void {
  let client: DashboardApiClient;

  test.beforeAll(async () => {
    client = await DashboardApiClient.create();
  });

  test('getApiVersions returns the apps API group', async () => {
    const versions = await client.getApiVersions();
    playExpect(versions.groups.some(group => group.name === 'apps')).toBeTruthy();
  });

  test('getApiResources returns core resources', async () => {
    const resources = await client.getApiResources('v1');
    playExpect(resources.groupVersion).toBe('v1');
    playExpect(resources.resources.some(resource => resource.kind === 'Pod')).toBeTruthy();
  });

  test('getApiResources returns apps resources', async () => {
    const resources = await client.getApiResources('apps/v1');
    playExpect(resources.groupVersion).toBe('apps/v1');
    playExpect(resources.resources.some(resource => resource.kind === 'Deployment')).toBeTruthy();
  });

  test('getApiResources preserves typed errors', async () => {
    await playExpect(client.getApiResources('missing.example.com/v1')).rejects.toMatchObject({
      name: 'ApiResourceError',
      statusCode: 404,
    });
  });

  test('getApiResources rejects invalid group versions', async () => {
    await playExpect(client.getApiResources('../v1')).rejects.toThrow('invalid groupVersion');
  });

  test.describe('patchResources', () => {
    let name: string;
    let secondName: string;

    test.beforeEach(() => {
      name = `dashboard-api-${randomUUID()}`;
      secondName = `${name}-second`;
      for (const configMapName of [name, secondName]) {
        kubectl([
          'create',
          'configmap',
          configMapName,
          '--from-literal=value=original',
          '--from-literal=preserved=keep',
        ]);
      }
    });

    test.afterEach(() => {
      kubectl([
        'delete',
        'configmap',
        name,
        secondName,
        `${name}-missing`,
        `${name}-missing-second`,
        '--ignore-not-found',
        '--wait=false',
      ]);
      kubectl(['delete', 'deployment', name, '--ignore-not-found', '--wait=false']);
    });

    test('patches multiple YAML documents with default options and namespace', async () => {
      await client.patchResources(`
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
data:
  value: patched
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${secondName}
  namespace: default
data:
  value: second-patched
`);

      for (const [configMapName, value] of [
        [name, 'patched'],
        [secondName, 'second-patched'],
      ]) {
        const result = JSON.parse(
          kubectl(['get', 'configmap', configMapName, '-o', 'json', '--show-managed-fields']),
        ) as ConfigMapResult;
        playExpect(result.data).toEqual({ value, preserved: 'keep' });
        playExpect(result.metadata.namespace).toBe('default');
        playExpect(result.metadata.managedFields).toContainEqual(
          playExpect.objectContaining({ manager: 'kubernetes-dashboard', operation: 'Update' }),
        );
      }
    });

    const strategies: (PatchStrategyType | undefined)[] = [undefined, 'strategic-merge-patch', 'merge-patch'];
    for (const strategy of strategies) {
      test(`uses ${strategy ?? 'default strategic merge'} semantics for container lists`, async () => {
        kubectl(
          ['create', '-f', '-'],
          JSON.stringify({
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name },
            spec: {
              replicas: 0,
              selector: { matchLabels: { app: name } },
              template: {
                metadata: { labels: { app: name } },
                spec: {
                  containers: [
                    { name: 'main', image: 'nginx:1.27' },
                    { name: 'sidecar', image: 'busybox:1.36' },
                  ],
                },
              },
            },
          }),
        );

        await client.patchResources(
          `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: default
spec:
  template:
    spec:
      containers:
        - name: main
          image: nginx:1.28
`,
          strategy === undefined ? undefined : { strategy },
        );

        const result = JSON.parse(kubectl(['get', 'deployment', name, '-o', 'json'])) as {
          spec: { template: { spec: { containers: { name: string; image: string }[] } } };
        };
        const containers = result.spec.template.spec.containers;
        playExpect(containers).toContainEqual(playExpect.objectContaining({ name: 'main', image: 'nginx:1.28' }));
        playExpect(containers).toHaveLength(strategy === 'merge-patch' ? 1 : 2);
        if (strategy !== 'merge-patch') {
          playExpect(containers).toContainEqual(
            playExpect.objectContaining({ name: 'sidecar', image: 'busybox:1.36' }),
          );
        }
      });
    }

    test('supports server-side apply with a custom field manager', async () => {
      const fieldManager = 'dashboard-api-e2e';
      await client.patchResources(
        `
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: default
data:
  owned: applied
`,
        { strategy: 'server-side-apply', fieldManager },
      );

      const result = JSON.parse(
        kubectl(['get', 'configmap', name, '-o', 'json', '--show-managed-fields']),
      ) as ConfigMapResult;
      playExpect(result.data).toEqual({ value: 'original', preserved: 'keep', owned: 'applied' });
      playExpect(result.metadata.managedFields).toContainEqual(
        playExpect.objectContaining({
          manager: fieldManager,
          operation: 'Apply',
          fieldsV1: playExpect.objectContaining({
            'f:data': playExpect.objectContaining({ 'f:owned': {} }),
          }),
        }),
      );
    });

    test('collects failures while patching the remaining documents', async () => {
      const missingName = `${name}-missing`;
      const secondMissingName = `${name}-missing-second`;
      await playExpect(
        client.patchResources(`
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${missingName}
  namespace: default
data:
  value: patched
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: default
data:
  value: patched
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${secondMissingName}
  namespace: default
data:
  value: patched
`),
      ).rejects.toMatchObject({
        name: 'AggregateError',
        errors: [
          playExpect.objectContaining({ message: playExpect.stringContaining(missingName) }),
          playExpect.objectContaining({ message: playExpect.stringContaining(secondMissingName) }),
        ],
      });
      playExpect(kubectl(['get', 'configmap', missingName, '--ignore-not-found', '-o', 'name']).trim()).toBe('');
      playExpect(kubectl(['get', 'configmap', secondMissingName, '--ignore-not-found', '-o', 'name']).trim()).toBe('');
      const result = JSON.parse(kubectl(['get', 'configmap', name, '-o', 'json'])) as ConfigMapResult;
      playExpect(result.data).toEqual({ value: 'patched', preserved: 'keep' });
    });

    test('rejects invalid YAML without modifying resources', async () => {
      await playExpect(client.patchResources('metadata: [')).rejects.toMatchObject({ name: 'YAMLException' });
      const result = JSON.parse(kubectl(['get', 'configmap', name, '-o', 'json'])) as ConfigMapResult;
      playExpect(result.data).toEqual({ value: 'original', preserved: 'keep' });
    });
  });

  test('contexts.connect supports selecting resources', async () => {
    try {
      await client.connect(CONTEXT_NAME, { resources: ['pods'] });
      const update = await client.nextResourceUpdate({ contextName: CONTEXT_NAME, resourceName: 'pods' });
      playExpect(update.resources).toContainEqual(
        playExpect.objectContaining({ contextName: CONTEXT_NAME, resourceName: 'pods' }),
      );
    } finally {
      await client.connect(CONTEXT_NAME);
    }
  });

  test('subscriber receives context health', async () => {
    await playExpect
      .poll(
        async () => {
          const event = await client.nextContextsHealth(3_000);
          return event.healths.some(health => health.contextName === CONTEXT_NAME && health.reachable);
        },
        { timeout: 15_000 },
      )
      .toBeTruthy();
  });

  test('subscriber receives context permissions', async () => {
    await playExpect
      .poll(
        async () => {
          const event = await client.nextContextsPermissions(3_000);
          return event.permissions.some(permission => permission.contextName === CONTEXT_NAME);
        },
        { timeout: 15_000 },
      )
      .toBeTruthy();
  });

  test('subscriber receives resource counts', async () => {
    await playExpect
      .poll(
        async () => {
          const event = await client.nextResourcesCount(3_000);
          return event.counts.some(count => count.contextName === CONTEXT_NAME && count.resourceName === 'pods');
        },
        { timeout: 15_000 },
      )
      .toBeTruthy();
  });

  test('subscriber receives resource updates', async () => {
    const event = await client.nextResourceUpdate({ contextName: CONTEXT_NAME, resourceName: 'pods' });
    playExpect(event.resources).toContainEqual(
      playExpect.objectContaining({ contextName: CONTEXT_NAME, resourceName: 'pods' }),
    );
  });
}
