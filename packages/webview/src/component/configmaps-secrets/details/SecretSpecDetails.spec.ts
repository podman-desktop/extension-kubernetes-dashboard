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

import type { V1Secret } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import SecretSpecDetails from './SecretSpecDetails.svelte';

const fakeSecret: V1Secret = {
  immutable: true,
  type: 'Opaque',
  data: {
    'key1': 'value1',
    'key2': 'value2',
  }
};

test('Secret details renders with correct values', async () => {
  render(SecretSpecDetails, { object: fakeSecret });

  expect(screen.getByText('Details')).toBeInTheDocument();
  
  expect(screen.getByText('Secret type')).toBeInTheDocument();
  expect(screen.getByText('Opaque')).toBeInTheDocument();

  expect(screen.getByText('Immutable')).toBeInTheDocument();
  expect(screen.getByText('Yes')).toBeInTheDocument();

  expect(screen.getByText('Data')).toBeInTheDocument();

  expect(screen.getByText('key1')).toBeInTheDocument();
  expect(screen.getByText('value1')).toBeInTheDocument();

  expect(screen.getByText('key2')).toBeInTheDocument();
  expect(screen.getByText('value2')).toBeInTheDocument();
});
