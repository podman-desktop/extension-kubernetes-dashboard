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

import { PatchStrategy } from '@kubernetes/client-node';

import type { ApplyResourcesOptions, PatchStrategyType } from '@kubernetes-dashboard/channels';

export const DEFAULT_FIELD_MANAGER = 'kubernetes-dashboard';

const PATCH_STRATEGY_MAP: Record<PatchStrategyType, PatchStrategy> = {
  'merge-patch': PatchStrategy.MergePatch,
  'strategic-merge-patch': PatchStrategy.StrategicMergePatch,
  'server-side-apply': PatchStrategy.ServerSideApply,
};

export interface ResourcePatchOptions {
  strategy: PatchStrategy;
  fieldManager: string;
  force: true | undefined;
  addLastAppliedAnnotation: boolean;
}

function resolvePatchStrategy(isCustomResource: boolean, requestedStrategy?: PatchStrategyType): PatchStrategy {
  if (requestedStrategy !== undefined) {
    return PATCH_STRATEGY_MAP[requestedStrategy];
  }
  // Kubernetes does not support strategic merge patch for custom resources.
  if (isCustomResource) {
    return PatchStrategy.ServerSideApply;
  }
  return PatchStrategy.StrategicMergePatch;
}

/** Resolves patch behavior from the selected strategy and resource kind without modifying a manifest. */
export function resolveResourcePatchOptions(
  isCustomResource: boolean,
  options?: ApplyResourcesOptions,
): ResourcePatchOptions {
  const strategy = resolvePatchStrategy(isCustomResource, options?.strategy);
  const fieldManager = options?.fieldManager ?? DEFAULT_FIELD_MANAGER;
  const isServerSideApply = strategy === PatchStrategy.ServerSideApply;
  const addLastAppliedAnnotation = !isServerSideApply;

  // Preserve automatic ownership takeover for custom-resource apply only.
  let force: true | undefined;
  if (isServerSideApply && isCustomResource) {
    force = true;
  }

  return { strategy, fieldManager, force, addLastAppliedAnnotation };
}
