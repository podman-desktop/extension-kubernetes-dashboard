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

// A resource key identifies the objects watched by an informer in a context:
// a resource name, optionally restricted to a namespace different from the namespace of the context.
// A key without namespace is the resource name itself, as used by the resource factories.

const NAMESPACE_SEPARATOR = '@';

export interface ResourceTarget {
  resourceName: string;
  namespace?: string;
}

export function toResourceKey(resourceName: string, namespace?: string): string {
  return namespace ? `${resourceName}${NAMESPACE_SEPARATOR}${namespace}` : resourceName;
}

export function parseResourceKey(resourceKey: string): ResourceTarget {
  const index = resourceKey.indexOf(NAMESPACE_SEPARATOR);
  if (index < 0) {
    return { resourceName: resourceKey };
  }
  return {
    resourceName: resourceKey.slice(0, index),
    namespace: resourceKey.slice(index + NAMESPACE_SEPARATOR.length),
  };
}
