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

import { router } from 'tinro';
import type { NavigationRequest } from './models/navigation-request';

export function navigateTo(nav: NavigationRequest): void {
  if (!nav.name) {
    // navigate to a kind (list)
    gotoKubernetesResources(nav.kind);
  } else {
    // navigate to a specific resource
    gotoKubernetesResource(nav.kind, nav.name, nav.namespace);
  }
}

// Returns the URL for the page displaying the list of resources of a specific kind (Pod, Node, etc)
export function kubernetesResourcesURL(kind: string): string {
  return `/${resourceKindToURL(kind)}`;
}

// Returns the URL for the page displaying the details of a resource of a specific kind (Pod, Node, etc), name and namespace
export function kubernetesResourceURL(kind: string, name: string, namespace?: string): string {
  if (namespace) {
    if (kind === 'Ingress') {
      return `/${resourceKindToURL(kind)}/ingress/${name}/${namespace}/summary`;
    } else if (kind === 'Route') {
      return `/${resourceKindToURL(kind)}/route/${name}/${namespace}/summary`;
    } else if (kind === 'ConfigMap') {
      return `/${resourceKindToURL(kind)}/configmap/${name}/${namespace}/summary`;
    } else if (kind === 'Secret') {
      return `/${resourceKindToURL(kind)}/secret/${name}/${namespace}/summary`;
    }
    return `/${resourceKindToURL(kind)}/${name}/${namespace}/summary`;
  }
  return `/${resourceKindToURL(kind)}/${name}/summary`;
}

function gotoKubernetesResources(kind: string): void {
  router.goto(kubernetesResourcesURL(kind));
}

function gotoKubernetesResource(kind: string, name: string, namespace?: string): void {
  router.goto(kubernetesResourceURL(kind, name, namespace));
}

function resourceKindToURL(kind: string): string {
  // handle the special cases in our urls
  if (kind === 'Ingress' || kind === 'Route') {
    return 'ingressesRoutes';
  } else if (kind === 'ConfigMap' || kind === 'Secret') {
    return 'configmapsSecrets';
  }
  // otherwise do the simple conversion
  return kind.toLowerCase() + 's';
}
