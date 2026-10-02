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

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  ApiGroupList,
  ApiResourceList,
  ConnectOptions,
  ContextsHealthsInfo,
  ContextsPermissionsInfo,
  ResourcesCountInfo,
  ResourceUpdateInfo,
  ResourceUpdateOptions,
} from '@podman-desktop/kubernetes-dashboard-extension-api';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const bridgeConfigFile = join(
  repositoryRoot,
  'tests',
  'playwright',
  'tests',
  'playwright',
  'output',
  'kubernetes-dashboard-tests',
  'plugins',
  'kubernetes-dashboard-api-e2e',
  'bridge-config.json',
);
const DEFAULT_TIMEOUT_MS = 10_000;
const STARTUP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 100;

interface BridgeConfig {
  handshakeFile: string;
  token: string;
}

interface BridgeHandshake {
  host: string;
  port: number;
}

interface BridgeErrorResponse {
  message: string;
  name: string;
  retryAfter?: string;
  statusCode?: number;
}

interface BridgeResponse<T> {
  data?: T;
  error?: BridgeErrorResponse;
  ok: boolean;
}

interface HealthResponse {
  dashboardAvailable: boolean;
}

type SubscriptionType = 'contexts-health' | 'contexts-permissions' | 'resources-count' | 'resource-update';

export class DashboardApiBridgeError extends Error {
  readonly retryAfter: string | undefined;
  readonly statusCode: number | undefined;

  constructor(error: BridgeErrorResponse) {
    super(error.message);
    this.name = error.name;
    this.retryAfter = error.retryAfter;
    this.statusCode = error.statusCode;
  }
}

export class DashboardApiClient {
  private constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  static async create(): Promise<DashboardApiClient> {
    const config = JSON.parse(await readFile(bridgeConfigFile, 'utf8')) as BridgeConfig;
    const handshake = await DashboardApiClient.waitForHandshake(config.handshakeFile);
    const client = new DashboardApiClient(`http://${handshake.host}:${handshake.port}`, config.token);
    await client.waitUntilReady();
    return client;
  }

  private static async waitForHandshake(handshakeFile: string): Promise<BridgeHandshake> {
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        return JSON.parse(await readFile(handshakeFile, 'utf8')) as BridgeHandshake;
      } catch {
        await DashboardApiClient.delay(POLL_INTERVAL_MS);
      }
    }
    throw new Error(`Timed out waiting for API E2E bridge handshake at ${handshakeFile}`);
  }

  private static delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  private async waitUntilReady(): Promise<void> {
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    let lastError: unknown;
    while (Date.now() < deadline) {
      try {
        const health = await this.request<HealthResponse>('/health');
        if (health.dashboardAvailable) {
          return;
        }
      } catch (error: unknown) {
        lastError = error;
      }
      await DashboardApiClient.delay(POLL_INTERVAL_MS);
    }
    throw new Error(`Timed out waiting for Kubernetes Dashboard API: ${String(lastError)}`);
  }

  getApiVersions(): Promise<ApiGroupList> {
    return this.request('/api-versions');
  }

  getApiResources(groupVersion: string, timeoutMs?: number): Promise<ApiResourceList> {
    const search = new URLSearchParams({ groupVersion });
    if (timeoutMs !== undefined) {
      search.set('timeoutMs', String(timeoutMs));
    }
    return this.request(`/api-resources?${search.toString()}`);
  }

  async connect(contextName: string, options?: ConnectOptions): Promise<void> {
    await this.request('/contexts/connect', { contextName, options });
  }

  nextContextsHealth(timeoutMs?: number): Promise<ContextsHealthsInfo> {
    return this.nextSubscriptionEvent('contexts-health', undefined, timeoutMs);
  }

  nextContextsPermissions(timeoutMs?: number): Promise<ContextsPermissionsInfo> {
    return this.nextSubscriptionEvent('contexts-permissions', undefined, timeoutMs);
  }

  nextResourcesCount(timeoutMs?: number): Promise<ResourcesCountInfo> {
    return this.nextSubscriptionEvent('resources-count', undefined, timeoutMs);
  }

  nextResourceUpdate(options: ResourceUpdateOptions, timeoutMs?: number): Promise<ResourceUpdateInfo> {
    return this.nextSubscriptionEvent('resource-update', options, timeoutMs);
  }

  private nextSubscriptionEvent<T>(
    type: SubscriptionType,
    options?: ResourceUpdateOptions,
    timeoutMs?: number,
  ): Promise<T> {
    return this.request('/subscriptions/next', { options, timeoutMs, type }, (timeoutMs ?? DEFAULT_TIMEOUT_MS) + 1_000);
  }

  private async request<T>(path: string, body?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      method: body === undefined ? 'GET' : 'POST',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const payload = (await response.json()) as BridgeResponse<T>;
    if (!payload.ok || payload.data === undefined) {
      throw new DashboardApiBridgeError(
        payload.error ?? {
          message: `API E2E bridge returned HTTP ${response.status}`,
          name: 'DashboardApiBridgeError',
          statusCode: response.status,
        },
      );
    }
    return payload.data;
  }
}
