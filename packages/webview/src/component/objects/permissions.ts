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

import type { CurrentContextInfo } from '@kubernetes-dashboard/channels';
import type { ContextPermission } from '@podman-desktop/kubernetes-dashboard-extension-api';

// isPermitted returns true if the resource is permitted in the current context,
// either cluster-wide (for a cluster-scoped resource) or in the namespace of the context.
// Permissions checked in other namespaces (requested by other extensions) are ignored
export function isPermitted(
  permissions: ContextPermission[],
  currentContext: CurrentContextInfo | undefined,
  resourceName: string,
): boolean {
  if (!currentContext?.contextName) {
    return false;
  }
  return permissions.some(
    permission =>
      permission.contextName === currentContext.contextName &&
      permission.resourceName === resourceName &&
      (permission.namespace === undefined || permission.namespace === currentContext.namespace) &&
      permission.permitted,
  );
}
