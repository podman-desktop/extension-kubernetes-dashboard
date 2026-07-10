/**********************************************************************
 * Copyright (C) 2024 - 2026 Red Hat, Inc.
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

import {
  KubernetesTroubleshootingInformation,
  ACTIVE_RESOURCES_COUNT,
  AVAILABLE_CONTEXTS,
  CONTEXTS_HEALTHS,
  CONTEXTS_PERMISSIONS,
  CURRENT_CONTEXT,
  ENDPOINTS,
  PORT_FORWARDS,
  RESOURCE_DETAILS,
  RESOURCE_EVENTS,
  RESOURCES_COUNT,
  UPDATE_RESOURCE,
  KUBERNETES_PROVIDERS,
  type UpdateResourceOptions,
} from '@kubernetes-dashboard/channels';

import type { ContextHealthState } from './context-health-checker.js';
import type { ContextPermissionResult } from './context-permissions-checker.js';
import type { DispatcherEvent } from './contexts-dispatcher.js';
import { ContextsManager } from './contexts-manager.js';
import { RpcChannel } from '@kubernetes-dashboard/rpc';
import { inject, injectable, multiInject } from 'inversify';
import { DispatcherObject, AbsDispatcherObjectImpl } from '/@/dispatcher/util/dispatcher-object.js';
import { ChannelSubscriber } from '/@/subscriber/channel-subscriber.js';
import { PortForwardServiceProvider } from '/@/port-forward/port-forward-service.js';
import { KubernetesProvidersManager } from '/@/manager/kubernetes-providers.js';
import { StateSubscriber } from '/@/subscriber/state-subscriber.js';

@injectable()
export class ContextsStatesDispatcher {
  @inject(ContextsManager)
  private manager: ContextsManager;

  @inject(PortForwardServiceProvider)
  private portForwardServiceProvider: PortForwardServiceProvider;

  @inject(KubernetesProvidersManager)
  private kubernetesProvidersManager: KubernetesProvidersManager;

  #dispatchers: Map<string, DispatcherObject<unknown>> = new Map();

  #subscribers: StateSubscriber[] = [];

  constructor(
    @multiInject(DispatcherObject) dispatchers: DispatcherObject<unknown>[],
    @inject(ChannelSubscriber) webviewSubscriber: ChannelSubscriber,
  ) {
    dispatchers.forEach(dispatcher => {
      this.#dispatchers.set(dispatcher.channelName, dispatcher);
    });

    this.#subscribers.push(webviewSubscriber);
  }

  init(): void {
    this.manager.onContextHealthStateChange(async (_state: ContextHealthState) => {
      await this.dispatch(CONTEXTS_HEALTHS);
    });
    this.manager.onOfflineChange(async () => {
      await this.dispatch(CONTEXTS_HEALTHS);
      await this.dispatch(RESOURCES_COUNT);
      await this.dispatch(ACTIVE_RESOURCES_COUNT);
    });
    this.manager.onContextPermissionResult(async (_permissions: ContextPermissionResult) => {
      await this.dispatch(CONTEXTS_PERMISSIONS);
    });
    this.manager.onContextDelete(async (_state: DispatcherEvent) => {
      await this.dispatch(CONTEXTS_HEALTHS);
      await this.dispatch(CONTEXTS_PERMISSIONS);
      await this.dispatch(AVAILABLE_CONTEXTS);
    });
    this.manager.onContextAdd(async (_state: DispatcherEvent) => {
      await this.dispatch(AVAILABLE_CONTEXTS);
    });
    this.manager.onResourceCountUpdated(async () => {
      await this.dispatch(RESOURCES_COUNT);
    });
    this.manager.onResourceUpdated(async () => {
      await this.dispatch(UPDATE_RESOURCE);
      await this.dispatch(RESOURCE_DETAILS);
      await this.dispatch(RESOURCE_EVENTS);
      await this.dispatch(ACTIVE_RESOURCES_COUNT);
    });
    this.manager.onCurrentContextChange(async () => {
      await this.dispatch(CURRENT_CONTEXT);
      await this.dispatch(UPDATE_RESOURCE);
    });
    this.portForwardServiceProvider.onForwardsChange(async () => {
      await this.dispatch(PORT_FORWARDS);
    });
    this.manager.onEndpointsChange(async () => {
      await this.dispatch(ENDPOINTS);
    });
    this.kubernetesProvidersManager.onKubernetesProvidersChange(async () => {
      await this.dispatch(KUBERNETES_PROVIDERS);
    });

    this.#subscribers.forEach(subscriber => {
      this.wireSubscriber(subscriber);
    });
  }

  private wireSubscriber(subscriber: StateSubscriber): void {
    subscriber.onSubscribe(channelName => {
      this.dispatchByChannelName(subscriber, channelName).catch(console.error);
      this.handleResourceSubscription(subscriber, channelName);
    });
    subscriber.onUnsubscribe(channelName => {
      this.handleResourceUnsubscription(subscriber, channelName);
    });
  }

  addSubscriber(subscriber: StateSubscriber): void {
    this.#subscribers.push(subscriber);
    this.wireSubscriber(subscriber);
  }

  /**
   * Remove a subscriber and clean up its timers from all dispatchers.
   * Should be called when a subscriber is disposed.
   */
  removeSubscriber(subscriber: StateSubscriber): void {
    // Clean up timers for this subscriber in all dispatchers
    for (const dispatcher of this.#dispatchers.values()) {
      if (dispatcher instanceof AbsDispatcherObjectImpl) {
        dispatcher.cleanupSubscriber(subscriber);
      }
    }

    // Remove from subscribers array
    this.#subscribers = this.#subscribers.filter(s => s !== subscriber);
  }

  // TODO replace this with an event
  getTroubleshootingInformation(): KubernetesTroubleshootingInformation {
    return this.manager.getTroubleshootingInformation();
  }

  async dispatch(channel: RpcChannel<unknown>): Promise<void> {
    for (const subscriber of this.#subscribers) {
      await this.dispatchByChannelName(subscriber, channel.name);
    }
  }

  async dispatchByChannelName(subscriber: StateSubscriber, channelName: string): Promise<void> {
    if (!subscriber.hasSubscribers(channelName)) {
      return;
    }
    const subscriptions = subscriber.getSubscriptions(channelName);

    const dispatcher = this.#dispatchers.get(channelName);
    if (!dispatcher) {
      console.error(`dispatcher not found for channel ${channelName}`);
      return;
    }
    await dispatcher.dispatch(subscriber, subscriptions);
  }

  #subscriberResourceTracker: Map<StateSubscriber, Map<string, Set<string>>> = new Map();

  private handleResourceSubscription(subscriber: StateSubscriber, channelName: string): void {
    if (channelName !== UPDATE_RESOURCE.name) {
      return;
    }
    const subscriptions = subscriber.getSubscriptions(channelName) as UpdateResourceOptions[];
    const currentContextName = this.manager.currentContext?.getKubeConfig().currentContext;

    for (const options of subscriptions) {
      const contextName = options.contextName ?? currentContextName;
      if (!contextName) continue;
      const subscriptionId = `${subscriber.constructor.name}:${channelName}:${contextName}:${options.resourceName}`;

      let tracked = this.#subscriberResourceTracker.get(subscriber);
      if (!tracked) {
        tracked = new Map();
        this.#subscriberResourceTracker.set(subscriber, tracked);
      }
      const key = `${contextName}/${options.resourceName}`;
      if (!tracked.has(key)) {
        tracked.set(key, new Set());
      }
      tracked.get(key)!.add(subscriptionId);

      this.manager.subscribeToResource(contextName, options.resourceName, subscriptionId);
    }
  }

  private handleResourceUnsubscription(subscriber: StateSubscriber, channelName: string): void {
    if (channelName !== UPDATE_RESOURCE.name) {
      return;
    }
    const tracked = this.#subscriberResourceTracker.get(subscriber);
    if (!tracked) return;

    const currentSubscriptions = new Set(
      (subscriber.getSubscriptions(channelName) as UpdateResourceOptions[])
        .map(options => {
          const contextName = options.contextName ?? this.manager.currentContext?.getKubeConfig().currentContext;
          return contextName ? `${contextName}/${options.resourceName}` : undefined;
        })
        .filter((key): key is string => key !== undefined),
    );

    for (const [key, subscriptionIds] of tracked.entries()) {
      if (!currentSubscriptions.has(key)) {
        const [contextName, resourceName] = key.split('/');
        for (const subscriptionId of subscriptionIds) {
          this.manager.unsubscribeFromResource(contextName, resourceName, subscriptionId);
        }
        tracked.delete(key);
      }
    }
  }
}
