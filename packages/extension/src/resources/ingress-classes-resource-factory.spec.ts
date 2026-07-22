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

import { IngressClassesResourceFactory } from './ingress-classes-resource-factory.js';

test('factory has correct resource name and kind', () => {
  const factory = new IngressClassesResourceFactory();
  expect(factory.resource).toBe('ingressclasses');
  expect(factory.kind).toBe('IngressClass');
});

test('deleteObject is defined', () => {
  const factory = new IngressClassesResourceFactory();
  expect(factory.deleteObject).toBeDefined();
});
