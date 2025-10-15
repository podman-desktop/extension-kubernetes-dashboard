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

import { IDisposable, KubernetesProvider } from '@kubernetes-dashboard/channels';
import { injectable } from 'inversify';
import { ConnectionFactory, ConnectionFactoryDetails, provider } from '@podman-desktop/api';
import { Emitter, Event } from '/@/types/emitter';

export interface KubernetesProvidersState {
  kubernetesProviders: KubernetesProvider[];
}

@injectable()
export class KubernetesProvidersManager implements IDisposable {
  #disposables: IDisposable[] = [];

  #onKubernetesProvidersChange = new Emitter<void>();
  onKubernetesProvidersChange: Event<void> = this.#onKubernetesProvidersChange.event;

  init(): void {
    // This test can be removed when the minimal version is set to 1.23
    if (!('onDidSetConnectionFactory' in provider)) {
      console.warn(
        'getting kubernetes providers is not supported in this version of Podman Desktop, please upgrade to the latest version',
      );
      return;
    }
    this.#disposables.push(
      provider.onDidSetConnectionFactory((e: ConnectionFactoryDetails) => {
        if (e.type !== 'kubernetes') {
          return;
        }
        this.#onKubernetesProvidersChange.fire();
      }),
    );
    this.#disposables.push(
      provider.onDidUnsetConnectionFactory((e: ConnectionFactory) => {
        if (e.type !== 'kubernetes') {
          return;
        }
        this.#onKubernetesProvidersChange.fire();
      }),
    );
  }

  getKubernetesProviders(): KubernetesProvider[] {
    const factories = provider.getConnectionFactories();
    return Array.from(factories)
      .filter(factory => factory.type === 'kubernetes')
      .map(factory => ({
        id: factory.providerId,
        creationDisplayName: factory.creationDisplayName,
        creationButtonTitle: factory.creationButtonTitle,
        emptyConnectionMarkdownDescription: factory.emptyConnectionMarkdownDescription,
        images: factory.images,
      }));
  }

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
  }
}
