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

import { describe, expect, test } from 'vitest';
import { parseResourceKey, toResourceKey } from './resource-key.js';

describe('toResourceKey', () => {
  test('returns the resource name when no namespace is given', () => {
    expect(toResourceKey('pods')).toEqual('pods');
  });

  test('appends the namespace', () => {
    expect(toResourceKey('catalogsources.operators.coreos.com', 'olm')).toEqual(
      'catalogsources.operators.coreos.com@olm',
    );
  });
});

describe('parseResourceKey', () => {
  test('parses a key without namespace', () => {
    expect(parseResourceKey('catalogsources.operators.coreos.com')).toEqual({
      resourceName: 'catalogsources.operators.coreos.com',
    });
  });

  test('parses a key with namespace', () => {
    expect(parseResourceKey(toResourceKey('pods', 'ns1'))).toEqual({ resourceName: 'pods', namespace: 'ns1' });
  });
});
