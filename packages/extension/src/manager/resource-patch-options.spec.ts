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

import type { PatchStrategyType } from '@kubernetes-dashboard/channels';
import { expect, test } from 'vitest';

import { resolveResourcePatchOptions } from './resource-patch-options.js';

type PatchOptionsCase = [
  description: string,
  isCustomResource: boolean,
  requestedStrategy: PatchStrategyType | undefined,
  expectedStrategy: PatchStrategy,
  expectedForce: true | undefined,
  expectedAnnotation: boolean,
];

const cases: PatchOptionsCase[] = [
  ['built-in default', false, undefined, PatchStrategy.StrategicMergePatch, undefined, true],
  ['custom default', true, undefined, PatchStrategy.ServerSideApply, true, false],
  ['built-in merge patch', false, 'merge-patch', PatchStrategy.MergePatch, undefined, true],
  ['custom merge patch', true, 'merge-patch', PatchStrategy.MergePatch, undefined, true],
  [
    'built-in strategic merge patch',
    false,
    'strategic-merge-patch',
    PatchStrategy.StrategicMergePatch,
    undefined,
    true,
  ],
  ['custom strategic merge patch', true, 'strategic-merge-patch', PatchStrategy.StrategicMergePatch, undefined, true],
  ['built-in server-side apply', false, 'server-side-apply', PatchStrategy.ServerSideApply, undefined, false],
  ['custom server-side apply', true, 'server-side-apply', PatchStrategy.ServerSideApply, true, false],
];

test.each(cases)(
  '%s',
  (_description, isCustomResource, requestedStrategy, strategy, force, addLastAppliedAnnotation) => {
    const options = requestedStrategy === undefined ? undefined : { strategy: requestedStrategy };

    expect(resolveResourcePatchOptions(isCustomResource, options)).toEqual({
      strategy,
      fieldManager: 'kubernetes-dashboard',
      force,
      addLastAppliedAnnotation,
    });
  },
);

test('uses the default behavior when the options object is empty', () => {
  expect(resolveResourcePatchOptions(false, {})).toEqual({
    strategy: PatchStrategy.StrategicMergePatch,
    fieldManager: 'kubernetes-dashboard',
    force: undefined,
    addLastAppliedAnnotation: true,
  });
});

test('uses a custom field manager while retaining the custom-resource default strategy', () => {
  expect(resolveResourcePatchOptions(true, { fieldManager: 'custom-manager' })).toEqual({
    strategy: PatchStrategy.ServerSideApply,
    fieldManager: 'custom-manager',
    force: true,
    addLastAppliedAnnotation: false,
  });
});
