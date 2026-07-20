/**********************************************************************
 * Copyright (C) 2023-2025 Red Hat, Inc.
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

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import type { ServiceUI } from '/@/component/services/ServiceUI';
import Type from './Type.svelte';

const service: ServiceUI = {
  uid: '123',
  name: 'my-service',
  kind: 'Service',
  status: '',
  namespace: '',
  selected: false,
  type: 'unknown',
  clusterIP: '',
  ports: '',
};

test.each([
  ['unknown', 'text-(--pd-badge-gray)'],
  ['ClusterIP', 'text-(--pd-badge-sky)'],
  ['LoadBalancer', 'text-(--pd-badge-purple)'],
  ['NodePort', 'text-(--pd-badge-fuschia)'],
])('Expect column styling for type %s', async (type, expectedClass) => {
  render(Type, { object: { ...service, type } });

  const text = screen.getByText(type);
  expect(text).toBeInTheDocument();

  const dot = text.parentElement?.children[0];
  expect(dot).toBeInTheDocument();
  expect(dot).toHaveClass(expectedClass);
});
