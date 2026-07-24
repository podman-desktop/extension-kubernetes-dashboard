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

import { expect, test } from 'vitest';

import { NetworkPoliciesResourceFactory } from './network-policies-resource-factory.js';

test('factory has correct resource name and kind', () => {
  const factory = new NetworkPoliciesResourceFactory();
  expect(factory.resource).toBe('networkpolicies');
  expect(factory.kind).toBe('NetworkPolicy');
});

test('deleteObject is defined', () => {
  const factory = new NetworkPoliciesResourceFactory();
  expect(factory.deleteObject).toBeDefined();
});
