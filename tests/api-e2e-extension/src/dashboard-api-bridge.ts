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

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname } from 'node:path';

import type {
  ContextsHealthsInfo,
  ContextsPermissionsInfo,
  KubernetesDashboardExtensionApi,
  KubernetesDashboardSubscriber,
  ResourcesCountInfo,
  ResourceUpdateInfo,
} from '@podman-desktop/kubernetes-dashboard-extension-api';
import { extensions, type Disposable } from '@podman-desktop/api';

import type { BridgeConfig, ConnectRequest, SubscriptionRequest } from './types';

const DASHBOARD_EXTENSION_ID = 'podman-desktop.kubernetes-dashboard';
const HOST = '127.0.0.1';
const MAX_REQUEST_BYTES = 64 * 1024;
const DEFAULT_SUBSCRIPTION_TIMEOUT_MS = 10_000;

interface ErrorResponse {
  message: string;
  name: string;
  retryAfter?: string;
  statusCode?: number;
}

type SubscriptionEvent = ContextsHealthsInfo | ContextsPermissionsInfo | ResourcesCountInfo | ResourceUpdateInfo;

class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class DashboardApiBridge implements Disposable {
  readonly #server: Server;
  #disposed = false;

  private constructor(private readonly config: BridgeConfig) {
    this.#server = createServer((request, response) => {
      this.handleRequest(request, response).catch((error: unknown) => {
        this.sendError(response, error);
      });
    });
  }

  static async create(configFile: string): Promise<DashboardApiBridge> {
    const config = JSON.parse(await readFile(configFile, 'utf8')) as BridgeConfig;
    if (!config.handshakeFile || !config.token) {
      throw new Error('Invalid API E2E bridge configuration');
    }
    const bridge = new DashboardApiBridge(config);
    await bridge.start();
    return bridge;
  }

  private async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.#server.once('error', reject);
      this.#server.listen(0, HOST, () => {
        this.#server.off('error', reject);
        resolve();
      });
    });
    const address = this.#server.address() as AddressInfo;
    await mkdir(dirname(this.config.handshakeFile), { recursive: true });
    await writeFile(this.config.handshakeFile, JSON.stringify({ host: HOST, port: address.port }), 'utf8');
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    this.authorize(request);
    const url = new URL(request.url ?? '/', `http://${HOST}`);
    const route = `${request.method ?? 'UNKNOWN'} ${url.pathname}`;
    switch (route) {
      case 'GET /health':
        this.sendSuccess(response, { dashboardAvailable: !!this.getDashboardApi() });
        break;
      case 'GET /api-versions':
        this.sendSuccess(response, await this.requireDashboardApi().getApiVersions());
        break;
      case 'GET /api-resources':
        await this.handleApiResources(url, response);
        break;
      case 'POST /contexts/connect':
        await this.handleConnect(request, response);
        break;
      case 'POST /subscriptions/next':
        await this.handleNextSubscription(request, response);
        break;
      default:
        throw new HttpError(`Unsupported route: ${route}`, 404);
    }
  }

  private async handleApiResources(url: URL, response: ServerResponse): Promise<void> {
    const groupVersion = url.searchParams.get('groupVersion');
    if (!groupVersion) {
      throw new HttpError('groupVersion is required', 400);
    }
    const timeout = url.searchParams.get('timeoutMs');
    const timeoutMs = timeout ? Number(timeout) : undefined;
    if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
      throw new HttpError('timeoutMs must be a positive number', 400);
    }
    const options = timeoutMs === undefined ? undefined : { timeoutMs };
    this.sendSuccess(response, await this.requireDashboardApi().getApiResources(groupVersion, options));
  }

  private async handleConnect(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.readJson<ConnectRequest>(request);
    if (!body.contextName) {
      throw new HttpError('contextName is required', 400);
    }
    await this.requireDashboardApi().contexts.connect(body.contextName, body.options);
    this.sendSuccess(response, undefined);
  }

  private async handleNextSubscription(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const body = await this.readJson<SubscriptionRequest>(request);
    this.sendSuccess(response, await this.nextSubscriptionEvent(this.requireDashboardApi(), body));
  }

  private authorize(request: IncomingMessage): void {
    if (request.headers.authorization !== `Bearer ${this.config.token}`) {
      throw new HttpError('Unauthorized', 401);
    }
  }

  private getDashboardApi(): KubernetesDashboardExtensionApi | undefined {
    const extension = extensions.getExtension<KubernetesDashboardExtensionApi>(DASHBOARD_EXTENSION_ID);
    if (!extension) {
      return undefined;
    }
    try {
      return extension.exports;
    } catch {
      return undefined;
    }
  }

  private requireDashboardApi(): KubernetesDashboardExtensionApi {
    const api = this.getDashboardApi();
    if (!api) {
      throw new HttpError('Kubernetes Dashboard API is not available', 503);
    }
    return api;
  }

  private async readJson<T>(request: IncomingMessage): Promise<T> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      size += buffer.length;
      if (size > MAX_REQUEST_BYTES) {
        throw new HttpError('Request body is too large', 413);
      }
      chunks.push(buffer);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
    } catch (error: unknown) {
      throw new HttpError(`Invalid JSON request body: ${String(error)}`, 400);
    }
  }

  private async nextSubscriptionEvent(
    api: KubernetesDashboardExtensionApi,
    request: SubscriptionRequest,
  ): Promise<SubscriptionEvent> {
    const subscriber = api.getSubscriber();
    let registration: Disposable | undefined;
    try {
      return await new Promise((resolve, reject) => {
        const timeoutMs = request.timeoutMs ?? DEFAULT_SUBSCRIPTION_TIMEOUT_MS;
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
          reject(new HttpError('timeoutMs must be a positive number', 400));
          return;
        }
        const timer = setTimeout(() => {
          reject(new HttpError(`Timed out waiting for ${request.type}`, 504));
        }, timeoutMs);
        const listener = (event: SubscriptionEvent): void => {
          clearTimeout(timer);
          resolve(event);
        };
        try {
          registration = this.registerSubscription(subscriber, request, listener);
        } catch (error: unknown) {
          clearTimeout(timer);
          reject(error);
        }
      });
    } finally {
      registration?.dispose();
      subscriber.dispose();
    }
  }

  private registerSubscription(
    subscriber: KubernetesDashboardSubscriber,
    request: SubscriptionRequest,
    listener: (event: SubscriptionEvent) => void,
  ): Disposable {
    switch (request.type) {
      case 'contexts-health':
        return subscriber.onContextsHealth(listener);
      case 'contexts-permissions':
        return subscriber.onContextsPermissions(listener);
      case 'resources-count':
        return subscriber.onResourcesCount(listener);
      case 'resource-update':
        if (!request.options?.resourceName) {
          throw new HttpError('resource-update requires options.resourceName', 400);
        }
        return subscriber.onResourceUpdate(request.options, listener);
      default:
        throw new HttpError(`Unsupported subscription type: ${String(request.type)}`, 400);
    }
  }

  private sendSuccess(response: ServerResponse, data: unknown): void {
    this.sendJson(response, 200, { data: data ?? {}, ok: true });
  }

  private sendError(response: ServerResponse, error: unknown): void {
    if (response.headersSent) {
      response.end();
      return;
    }
    const httpStatus = error instanceof HttpError ? error.statusCode : 500;
    this.sendJson(response, httpStatus, { error: this.serializeError(error), ok: false });
  }

  private serializeError(error: unknown): ErrorResponse {
    const result: ErrorResponse = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Error',
    };
    if (error && typeof error === 'object') {
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        result.statusCode = error.statusCode;
      }
      if ('retryAfter' in error && typeof error.retryAfter === 'string') {
        result.retryAfter = error.retryAfter;
      }
    }
    return result;
  }

  private sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    this.#server.close();
  }
}
