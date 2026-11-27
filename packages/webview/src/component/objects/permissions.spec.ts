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

import type { ContextPermission } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { describe, expect, test } from 'vitest';
import { isPermitted } from './permissions';

const currentContext = { contextName: 'ctx1', namespace: 'ns1' };

function permission(fields: Partial<ContextPermission>): ContextPermission {
  return { contextName: 'ctx1', resourceName: 'pods', permitted: true, ...fields };
}

describe('isPermitted', () => {
  test('permitted in the namespace of the context', () => {
    expect(isPermitted([permission({ namespace: 'ns1' })], currentContext, 'pods')).toBeTruthy();
  });

  test('permitted cluster-wide', () => {
    expect(isPermitted([permission({ resourceName: 'nodes' })], currentContext, 'nodes')).toBeTruthy();
  });

  test('a permission in another namespace is ignored', () => {
    expect(isPermitted([permission({ namespace: 'other' })], currentContext, 'pods')).toBeFalsy();
  });

  test('a denied permission in the namespace of the context is not overridden by another namespace', () => {
    expect(
      isPermitted(
        [permission({ namespace: 'ns1', permitted: false }), permission({ namespace: 'other' })],
        currentContext,
        'pods',
      ),
    ).toBeFalsy();
  });

  test('a permission of another context is ignored', () => {
    expect(isPermitted([permission({ contextName: 'ctx2', namespace: 'ns1' })], currentContext, 'pods')).toBeFalsy();
  });

  test('a permission of another resource is ignored', () => {
    expect(isPermitted([permission({ namespace: 'ns1' })], currentContext, 'deployments')).toBeFalsy();
  });

  test('nothing is permitted without current context', () => {
    expect(isPermitted([permission({ namespace: 'ns1' })], undefined, 'pods')).toBeFalsy();
  });
});
