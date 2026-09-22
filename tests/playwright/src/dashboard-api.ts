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

import { DashboardApiClient } from './utility/dashboard-api-client';

const CONTEXT_NAME = 'envtest';

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
