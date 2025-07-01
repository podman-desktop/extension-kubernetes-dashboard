/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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
import { kubernetes, Uri, window } from '@podman-desktop/api';

import { RpcExtension } from '/@common/rpc/rpc';

import { readFile } from 'node:fs/promises';
import { ContextsManager } from '/@/manager/contexts-manager';
import { existsSync } from 'node:fs';
import { KubeConfig } from '@kubernetes/client-node';
import { ContextsStatesDispatcher } from '/@/manager/contexts-states-dispatcher';
import { DashboardImpl } from '/@/controller/dashboard-impl';

export class DashboardExtension {
  #extensionContext: ExtensionContext;
  #contextsManager: ContextsManager;
  #contextsStatesDispatcher: ContextsStatesDispatcher;

  constructor(readonly extensionContext: ExtensionContext) {
    this.#extensionContext = extensionContext;
  }

  async activate(): Promise<void> {
    const panel = await this.createWebview();

    // Register webview communication for this webview
    const rpcExtension = new RpcExtension(panel.webview);
    rpcExtension.init();
    this.#extensionContext.subscriptions.push(rpcExtension);

    this.#contextsManager = new ContextsManager();
    this.#contextsStatesDispatcher = new ContextsStatesDispatcher(this.#contextsManager, rpcExtension);

    const now = performance.now();

    const afterFirst = performance.now();

    console.log('activation time:', afterFirst - now);

    // Register all controllers
    const dashboardImpl = new DashboardImpl(this.#contextsStatesDispatcher);
    rpcExtension.registerInstance(dashboardImpl.getChannel(), dashboardImpl);

    await this.listenMonitoring();
    await this.startMonitoring();
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
