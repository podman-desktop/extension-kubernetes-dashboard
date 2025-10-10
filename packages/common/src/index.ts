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

import type { ContextsApi } from './interface/contexts-api';
import type { PodLogsApi } from './interface/pod-logs-api';
import type { PodTerminalsApi } from './interface/pod-terminals-api';
import type { PortForwardApi } from './interface/port-forward-api';
import type { SubscribeApi } from './interface/subscribe-api';
import type { SystemApi } from './interface/system-api';
import type { ActiveResourcesCountInfo } from './model/active-resources-count-info';
import type { AvailableContextsInfo } from './model/available-contexts-info';
import type { ContextsHealthsInfo } from './model/contexts-healths-info';
import type { ContextsPermissionsInfo } from './model/contexts-permissions-info';
import type { CurrentContextInfo } from './model/current-context-info';
import type { EndpointsInfo } from './model/endpoints-info';
import type { PodLogsChunk } from './model/pod-logs-chunk';
import type { PodTerminalChunk } from './model/pod-terminal-chunk';
import type { PortForwardsInfo } from './model/port-forward-info';
import type { ResourceDetailsInfo } from './model/resource-details-info';
import type { ResourceEventsInfo } from './model/resource-events-info';
import type { ResourcesCountInfo } from './model/resources-count-info';
import type { UpdateResourceInfo } from './model/update-resource-info';

import { createRpcChannel } from '@kubernetes-dashboard/rpc';

// RPC channels (used by the webview to send requests to the extension)
export const API_CONTEXTS = createRpcChannel<ContextsApi>('ContextsApi');
export const API_SUBSCRIBE = createRpcChannel<SubscribeApi>('SubscribeApi');
export const API_SYSTEM = createRpcChannel<SystemApi>('SystemApi');
export const API_PORT_FORWARD = createRpcChannel<PortForwardApi>('PortForwardApi');

// Broadcast events (sent by extension and received by the webview)
export const RESOURCES_COUNT = createRpcChannel<ResourcesCountInfo>('ResourcesCount');
export const ACTIVE_RESOURCES_COUNT = createRpcChannel<ActiveResourcesCountInfo>('ActiveResourcesCount');
export const CONTEXTS_HEALTHS = createRpcChannel<ContextsHealthsInfo>('ContextsHealths');
export const CONTEXTS_PERMISSIONS = createRpcChannel<ContextsPermissionsInfo>('ContextsPermissions');
export const UPDATE_RESOURCE = createRpcChannel<UpdateResourceInfo>('UpdateResource');
export const CURRENT_CONTEXT = createRpcChannel<CurrentContextInfo>('CurrentContext');
export const AVAILABLE_CONTEXTS = createRpcChannel<AvailableContextsInfo>('AvailableContexts');
export const RESOURCE_DETAILS = createRpcChannel<ResourceDetailsInfo>('ResourceDetailsInfo');
export const RESOURCE_EVENTS = createRpcChannel<ResourceEventsInfo>('ResourceEvents');
export const PORT_FORWARDS = createRpcChannel<PortForwardsInfo>('PortForwards');
export const ENDPOINTS = createRpcChannel<EndpointsInfo>('Endpoints');

// Channels fot streams
export const API_POD_LOGS = createRpcChannel<PodLogsApi>('PodLogsApi');
export const POD_LOGS = createRpcChannel<PodLogsChunk>('PodLogs');

export const API_POD_TERMINALS = createRpcChannel<PodTerminalsApi>('PodTerminalsApi');
export const POD_TERMINAL_DATA = createRpcChannel<PodTerminalChunk>('PodTerminalData');
