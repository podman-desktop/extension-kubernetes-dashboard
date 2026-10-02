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
import { fileURLToPath } from 'node:url';

import { expect as playExpect, test } from '@podman-desktop/tests-playwright';

import { DashboardApiClient } from './utility/dashboard-api-client';

const KUBECTL_TIMEOUT_MS = process.platform === 'win32' ? 30_000 : 10_000;
const kubeconfig = fileURLToPath(new URL('../../resources/envtest-kubeconfig', import.meta.url));
// Public test CSR; its private key is not needed for approval and is not stored.
const certificateRequest = `-----BEGIN CERTIFICATE REQUEST-----
MIHWMH4CAQAwHDEaMBgGA1UEAwwRZGFzaGJvYXJkLWFwaS1lMmUwWTATBgcqhkjO
PQIBBggqhkjOPQMBBwNCAARY/ICvCzNNwjqd08nYmAq4Duopp42f2QHMc+STr6bD
hA0avLGZxvFkusn0cwQArTteYKfDoLAo1x6Tho3N0tbkoAAwCgYIKoZIzj0EAwID
SAAwRQIhAN+rJeJlV3M4gEYX+HuO8E09+wO5ddxfqphM0eBYTpBTAiAZ/CzCtkZn
7HVg47CrVCDpIzYjVHyDNbg0OSzNyg67vw==
-----END CERTIFICATE REQUEST-----
`;

function kubectl(args: string[], input?: object): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line sonarjs/os-command
    const child = execFile(
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      'kubectl',
      ['--kubeconfig', kubeconfig, '--context', 'envtest', '--namespace', 'default', ...args],
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

export function dashboardApiPatchSubresourceTests(): void {
  test.describe('patchSubresource', () => {
    if (process.platform === 'win32') {
      test.setTimeout(120_000);
    }

    let client: DashboardApiClient;
    let name: string;

    test.beforeAll(async () => {
      client = await DashboardApiClient.create();
    });

    test.beforeEach(() => {
      name = `dashboard-subresource-${randomUUID()}`;
    });

    test.afterEach(async () => {
      for (const resource of ['replicationcontroller', 'deployment', 'node', 'certificatesigningrequest']) {
        await kubectl(['delete', resource, name, '--ignore-not-found', '--wait=false']);
      }
    });

    test('patches a namespaced core resource scale', async () => {
      await kubectl(['create', '-f', '-'], {
        apiVersion: 'v1',
        kind: 'ReplicationController',
        metadata: { name },
        spec: {
          replicas: 0,
          selector: { app: name },
          template: { metadata: { labels: { app: name } }, spec: { containers: [{ name: 'main', image: 'nginx' }] } },
        },
      });

      await client.patchSubresource(
        'v1',
        'replicationcontrollers',
        name,
        'scale',
        { spec: { replicas: 3 } },
        'default',
      );

      const result = JSON.parse(await kubectl(['get', 'replicationcontroller', name, '-o', 'json'])) as {
        spec: { replicas: number; selector: { app: string } };
      };
      playExpect(result.spec.replicas).toBe(3);
      playExpect(result.spec.selector).toEqual({ app: name });
    });

    test('patches a namespaced grouped resource scale', async () => {
      await kubectl(['create', '-f', '-'], {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name },
        spec: {
          replicas: 0,
          selector: { matchLabels: { app: name } },
          template: { metadata: { labels: { app: name } }, spec: { containers: [{ name: 'main', image: 'nginx' }] } },
        },
      });

      await client.patchSubresource('apps/v1', 'deployments', name, 'scale', { spec: { replicas: 2 } }, 'default');

      const result = JSON.parse(await kubectl(['get', 'deployment', name, '-o', 'json'])) as {
        spec: { replicas: number; template: { spec: { containers: { name: string; image: string }[] } } };
      };
      playExpect(result.spec.replicas).toBe(2);
      playExpect(result.spec.template.spec.containers).toEqual([
        playExpect.objectContaining({ name: 'main', image: 'nginx' }),
      ]);
    });

    test('patches a cluster-scoped core resource status using merge semantics', async () => {
      await kubectl(['create', '-f', '-'], {
        apiVersion: 'v1',
        kind: 'Node',
        metadata: { name },
        spec: { unschedulable: true },
      });

      await client.patchSubresource('v1', 'nodes', name, 'status', { status: { capacity: { cpu: '2' } } });
      await client.patchSubresource('v1', 'nodes', name, 'status', { status: { capacity: { memory: '1Gi' } } });

      const result = JSON.parse(await kubectl(['get', 'node', name, '-o', 'json'])) as {
        spec: { unschedulable: boolean };
        status: { capacity: Record<string, string> };
      };
      playExpect(result.status.capacity).toMatchObject({ cpu: '2', memory: '1Gi' });
      playExpect(result.spec.unschedulable).toBe(true);
    });

    test('patches a cluster-scoped grouped resource approval', async () => {
      await kubectl(['create', '-f', '-'], {
        apiVersion: 'certificates.k8s.io/v1',
        kind: 'CertificateSigningRequest',
        metadata: { name },
        spec: {
          request: Buffer.from(certificateRequest).toString('base64'),
          signerName: 'example.com/dashboard-api-e2e',
          usages: ['client auth'],
        },
      });

      await client.patchSubresource('certificates.k8s.io/v1', 'certificatesigningrequests', name, 'approval', {
        status: {
          conditions: [
            { type: 'Approved', status: 'True', reason: 'DashboardApiE2E', message: 'Approved by API E2E test' },
          ],
        },
      });

      const result = JSON.parse(await kubectl(['get', 'certificatesigningrequest', name, '-o', 'json'])) as {
        spec: { signerName: string };
        status: { conditions: { type: string; status: string; reason: string }[] };
      };
      playExpect(result.status.conditions).toContainEqual(
        playExpect.objectContaining({ type: 'Approved', status: 'True', reason: 'DashboardApiE2E' }),
      );
      playExpect(result.spec.signerName).toBe('example.com/dashboard-api-e2e');
    });

    test('propagates an API-server error for a missing resource', async () => {
      await playExpect(
        client.patchSubresource('apps/v1', 'deployments', name, 'scale', { spec: { replicas: 1 } }, 'default'),
      ).rejects.toMatchObject({
        name: 'Error',
        message: playExpect.stringContaining('patch subresource failed with status 404:'),
      });
      playExpect((await kubectl(['get', 'deployment', name, '--ignore-not-found', '-o', 'name'])).trim()).toBe('');
    });
  });
}
