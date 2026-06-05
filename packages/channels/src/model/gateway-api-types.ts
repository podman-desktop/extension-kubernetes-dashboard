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

import type { V1ManagedFieldsEntry } from '@kubernetes/client-node';

export type V1HTTPRoute = {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    managedFields?: Array<V1ManagedFieldsEntry>;
    creationTimestamp?: Date;
  };
  spec?: V1HTTPRouteSpec;
};

export type V1HTTPRouteSpec = {
  hostnames?: string[];
  parentRefs?: V1HTTPRouteParentRef[];
  rules?: V1HTTPRouteRule[];
};

export type V1HTTPRouteParentRef = {
  group?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  sectionName?: string;
  port?: number;
};

export type V1HTTPRouteRule = {
  matches?: V1HTTPRouteMatch[];
  backendRefs?: V1HTTPRouteBackendRef[];
};

export type V1HTTPRouteMatch = {
  path?: {
    type?: string;
    value?: string;
  };
  method?: string;
};

export type V1HTTPRouteBackendRef = {
  group?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  port?: number;
  weight?: number;
};
