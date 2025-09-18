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

export const ContextsApi = Symbol.for('ContextsApi');

export interface ContextsApi {
  refreshContextState(contextName: string): Promise<void>;
  deleteObject(kind: string, name: string, namespace?: string): Promise<void>;
  deleteObjects(objects: { kind: string; name: string; namespace?: string }[]): Promise<void>;
  setCurrentNamespace(namespace: string): Promise<void>;
  restartObject(kind: string, name: string, namespace: string): Promise<void>;
  applyResources(yamlDocuments: string): Promise<void>;
}
