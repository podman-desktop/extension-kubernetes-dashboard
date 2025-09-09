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

import '@testing-library/jest-dom/vitest';

import type { V1ConfigMap } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import ConfigMapSpecDetails from './ConfigMapSpecDetails.svelte';

const fakeConfigMap: V1ConfigMap = {
  immutable: false,
  binaryData: {
    'bd1': 'some value',
    'bd2': 'some data',
  },
  data: {
    'key1': 'value1',
    'key2': 'value2',
  }
};

test('ConfigMap details renders with correct values', async () => {
  render(ConfigMapSpecDetails, { object: fakeConfigMap });

  expect(screen.getByText('Details')).toBeInTheDocument();
  
  expect(screen.getByText('Type')).toBeInTheDocument();
  expect(screen.getByText('ConfigMap')).toBeInTheDocument();

  expect(screen.getByText('Immutable')).toBeInTheDocument();
  expect(screen.getByText('No')).toBeInTheDocument();

  expect(screen.getByText('Binary Data')).toBeInTheDocument();

  expect(screen.getByText('bd1: 10 bytes')).toBeInTheDocument();
  expect(screen.getByText('bd2: 9 bytes')).toBeInTheDocument();

  expect(screen.getByText('Data')).toBeInTheDocument();

  expect(screen.getByText('key1')).toBeInTheDocument();
  expect(screen.getByText('value1')).toBeInTheDocument();

  expect(screen.getByText('key2')).toBeInTheDocument();
  expect(screen.getByText('value2')).toBeInTheDocument();
});
