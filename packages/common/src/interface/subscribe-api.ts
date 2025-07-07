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

export const SubscribeApi = Symbol.for('SubscribeApi');

/**
 * Interface for webview to subscribe to broadcast events
 *
 * It is the responsabiility of the caller to manage unique subscription ids
 * to remove the necessity to get the unique ID from the API in an asynchronous way
 */
export interface SubscribeApi {
  resetChannelSubscribers(channelName: string): Promise<void>;
  subscribeToChannel<T>(channelName: string, options: T, subscription: number): Promise<void>;
  unsubscribeFromChannel(channelName: string, subscription: number): Promise<void>;
}
