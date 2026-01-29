/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

import type { WebviewPanel, ExtensionContext, KubeconfigUpdateEvent } from '@podman-desktop/api';
import { env, kubernetes, Uri, window } from '@podman-desktop/api';

import { RpcExtension } from '@kubernetes-dashboard/rpc';

import { readFile } from 'node:fs/promises';
import { ContextsManager } from '/@/manager/contexts-manager';
import { existsSync } from 'node:fs';
import { KubeConfig } from '@kubernetes/client-node';
import { ContextsStatesDispatcher } from '/@/manager/contexts-states-dispatcher';
import { InversifyBinding } from '/@/inject/inversify-binding';
import type { Container } from 'inversify';
import {
  API_CONTEXTS,
  API_NAVIGATION,
  API_POD_LOGS,
  API_POD_TERMINALS,
  API_PORT_FORWARD,
  API_SUBSCRIBE,
  API_SYSTEM,
  API_TELEMETRY,
  CONTEXTS_HEALTHS,
  CONTEXTS_PERMISSIONS,
  IDisposable,
  RESOURCES_COUNT,
} from '@kubernetes-dashboard/channels';
import { SystemApiImpl } from './manager/system-api';
import { PortForwardApiImpl } from './manager/port-forward-api-impl';
import { PortForwardServiceProvider } from './port-forward/port-forward-service';
import { PodLogsApiImpl } from './manager/pod-logs-api-impl';
import { PodTerminalsApiImpl } from './manager/pod-terminals-api-impl';
import { NavigationApiImpl } from '/@/manager/navigation-api';
import { KubernetesProvidersManager } from '/@/manager/kubernetes-providers';
import { ChannelSubscriber } from '/@/subscriber/channel-subscriber';
import type {
  ConnectOptions,
  ContextsHealthsInfo,
  ContextsPermissionsInfo,
  KubernetesDashboardExtensionApi,
  KubernetesDashboardSubscriber,
  ResourcesCountInfo,
} from '@podman-desktop/kubernetes-dashboard-extension-api';
import { ApiSubscriber } from '/@/subscriber/api-subscriber';
import { TelemetryApiImpl } from './manager/telemetry-api';

export class DashboardExtension {
  #container: Container | undefined;
  #inversifyBinding: InversifyBinding | undefined;

  #extensionContext: ExtensionContext;

  #contextsManager: ContextsManager;
  #contextsStatesDispatcher: ContextsStatesDispatcher;
  #systemApiImpl: SystemApiImpl;
  #portForwardApiImpl: PortForwardApiImpl;
  #portForwardServiceProvider: PortForwardServiceProvider;
  #podLogsApiImpl: PodLogsApiImpl;
  #podTerminalsApiImpl: PodTerminalsApiImpl;
  #navigationApiImpl: NavigationApiImpl;
  #kubernetesProvidersManager: KubernetesProvidersManager;
  #webviewSubscriber: ChannelSubscriber;
  #telemetryApiImpl: TelemetryApiImpl;

  constructor(readonly extensionContext: ExtensionContext) {
    this.#extensionContext = extensionContext;
  }

  async activate(): Promise<KubernetesDashboardExtensionApi> {
    const telemetryLogger = env.createTelemetryLogger();

    const panel = await this.createWebview();

    // Register webview communication for this webview
    const rpcExtension = new RpcExtension(panel.webview);
    rpcExtension.init();
    this.#extensionContext.subscriptions.push(rpcExtension);

    const now = performance.now();
    this.#inversifyBinding = new InversifyBinding(rpcExtension, this.extensionContext, telemetryLogger);
    this.#container = await this.#inversifyBinding.initBindings();

    this.#contextsManager = await this.#container.getAsync(ContextsManager);
    this.#contextsStatesDispatcher = await this.#container.getAsync(ContextsStatesDispatcher);
    this.#systemApiImpl = await this.#container.getAsync(SystemApiImpl);
    this.#portForwardApiImpl = await this.#container.getAsync(PortForwardApiImpl);
    this.#portForwardServiceProvider = await this.#container.getAsync(PortForwardServiceProvider);
    this.#podLogsApiImpl = await this.#container.getAsync(PodLogsApiImpl);
    this.#podTerminalsApiImpl = await this.#container.getAsync(PodTerminalsApiImpl);
    this.#navigationApiImpl = await this.#container.getAsync(NavigationApiImpl);
    this.#kubernetesProvidersManager = await this.#container.getAsync(KubernetesProvidersManager);
    this.#webviewSubscriber = await this.#container.getAsync(ChannelSubscriber);
    this.#telemetryApiImpl = await this.#container.getAsync(TelemetryApiImpl);

    this.#kubernetesProvidersManager.init();

    const afterFirst = performance.now();

    console.log('activation time:', afterFirst - now);

    rpcExtension.registerInstance(API_SUBSCRIBE, this.#webviewSubscriber);
    rpcExtension.registerInstance(API_CONTEXTS, this.#contextsManager);
    rpcExtension.registerInstance(API_SYSTEM, this.#systemApiImpl);
    rpcExtension.registerInstance(API_PORT_FORWARD, this.#portForwardApiImpl);
    rpcExtension.registerInstance(API_POD_LOGS, this.#podLogsApiImpl);
    rpcExtension.registerInstance(API_POD_TERMINALS, this.#podTerminalsApiImpl);
    rpcExtension.registerInstance(API_NAVIGATION, this.#navigationApiImpl);
    rpcExtension.registerInstance(API_TELEMETRY, this.#telemetryApiImpl);

    await this.listenMonitoring();
    await this.startMonitoring();
    await this.startPortForwarding();

    const disposables = await this.#container.getAllAsync<IDisposable>(IDisposable);

    panel.onDidChangeViewState(event => {
      if (!event.webviewPanel.active) {
        for (const disposable of disposables) {
          disposable.dispose();
        }
      }
    });

    return {
      getSubscriber: () => {
        const subscriber = new ApiSubscriber();
        this.#contextsStatesDispatcher.addSubscriber(subscriber);
        return {
          onContextsHealth: (listener: (event: ContextsHealthsInfo) => void): IDisposable => {
            return subscriber.subscribe(CONTEXTS_HEALTHS, undefined, listener);
          },
          onContextsPermissions: (listener: (event: ContextsPermissionsInfo) => void): IDisposable => {
            return subscriber.subscribe(CONTEXTS_PERMISSIONS, undefined, listener);
          },
          onResourcesCount: (listener: (event: ResourcesCountInfo) => void): IDisposable => {
            return subscriber.subscribe(RESOURCES_COUNT, undefined, listener);
          },
          dispose: () => {
            this.#contextsStatesDispatcher.removeSubscriber(subscriber);
            subscriber.dispose();
          },
        } as KubernetesDashboardSubscriber;
      },
      contexts: {
        connect: (contextName: string, options?: ConnectOptions) => {
          return this.#contextsManager.refreshContextState(contextName, options);
        },
      },
    } as KubernetesDashboardExtensionApi;
  }

  async deactivate(): Promise<void> {
    console.log('deactivating Kubernetes Dashboard extension');
  }

  private async createWebview(): Promise<WebviewPanel> {
    const panel = window.createWebviewPanel('kubernetes-dashboard', 'Kubernetes', {
      localResourceRoots: [Uri.joinPath(this.#extensionContext.extensionUri, 'media')],
    });
    this.#extensionContext.subscriptions.push(panel);

    // Set the index.html file for the webview.
    const indexHtmlUri = Uri.joinPath(this.#extensionContext.extensionUri, 'media', 'index.html');
    const indexHtmlPath = indexHtmlUri.fsPath;

    let indexHtml = await readFile(indexHtmlPath, 'utf8');

    const scriptLink = indexHtml.match(/<script[^>]{0,50}src="([^"]+)"[^>]{0,50}>/g);
    if (scriptLink) {
      scriptLink.forEach(link => {
        const src = /src="(.*?)"/.exec(link);
        if (src) {
          const webviewSrc = panel.webview.asWebviewUri(
            Uri.joinPath(this.#extensionContext.extensionUri, 'media', src[1]),
          );
          indexHtml = indexHtml.replace(src[1], webviewSrc.toString());
        }
      });
    }

    const cssLink = indexHtml.match(/<link[^>]{0,50}href="([^"]+)"[^>]{0,50}>/g);
    if (cssLink) {
      cssLink.forEach(link => {
        const href = /href="(.*?)"/.exec(link);
        if (href) {
          const webviewHref = panel.webview.asWebviewUri(
            Uri.joinPath(this.#extensionContext.extensionUri, 'media', href[1]),
          );
          indexHtml = indexHtml.replace(href[1], webviewHref.toString());
        }
      });
    }

    // Update the webview panel with the new index.html file with corrected links.
    panel.webview.html = indexHtml;

    return panel;
  }

  private async listenMonitoring(): Promise<void> {
    this.#contextsStatesDispatcher.init();
  }

  private async startPortForwarding(): Promise<void> {
    this.#portForwardServiceProvider.init();
  }

  private async startMonitoring(): Promise<void> {
    this.#extensionContext.subscriptions.push(this.#contextsManager);

    const kubeconfigWatcher = kubernetes.onDidUpdateKubeconfig(this.onKubeconfigUpdate.bind(this));
    this.#extensionContext.subscriptions.push(kubeconfigWatcher);

    // initial state is not sent by watcher, let's get it explicitely
    const kubeconfig = kubernetes.getKubeconfig();
    if (existsSync(kubeconfig.path)) {
      await this.onKubeconfigUpdate({
        location: kubeconfig,
        type: 'CREATE',
      });
    }
  }

  private async onKubeconfigUpdate(event: KubeconfigUpdateEvent): Promise<void> {
    if (event.type === 'DELETE') {
      // update with an empty KubeConfig
      await this.#contextsManager.update(new KubeConfig());
      return;
    }
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromFile(event.location.path);
    await this.#contextsManager.update(kubeConfig);
  }
}
