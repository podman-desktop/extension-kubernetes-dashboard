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

export interface IDisposable {
  dispose(): void;
}

export interface AvailableContextsInfo {
  contextNames: string[];
}

export interface CurrentContextInfo {
  contextName?: string;
  namespace?: string;
}

export interface KubernetesDashboardSubscriber extends IDisposable {
  onAvailableContexts(listener: (event: AvailableContextsInfo) => void): IDisposable;
  onCurrentContext(listener: (event: CurrentContextInfo) => void): IDisposable;
}

export interface KubernetesDashboardExtensionApi {
  getSubscriber(): KubernetesDashboardSubscriber;
}
