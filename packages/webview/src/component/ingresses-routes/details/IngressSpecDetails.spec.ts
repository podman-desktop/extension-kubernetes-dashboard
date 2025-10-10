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

import type { V1IngressSpec } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import IngressSpecDetails from './IngressSpecDetails.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_SYSTEM } from '/@common/index';
import type { SystemApi } from '/@common/interface/system-api';

const fakeIngressSpec: V1IngressSpec = {
  rules: [
    {
      host: 'example.com',
      http: {
        paths: [
          {
            path: '/api',
            pathType: 'Prefix',
            backend: {
              service: {
                name: 'api-service',
                port: {
                  number: 8080,
                },
              },
            },
          },
        ],
      },
    },
  ],
  tls: [
    {
      hosts: ['example.com'],
      secretName: 'example-tls',
    },
  ],
};

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    openExternal: vi.fn(),
  } as unknown as SystemApi);
});

test('Ingress artifact renders with correct values', async () => {
  render(IngressSpecDetails, { spec: fakeIngressSpec });

  expect(screen.getByText(/Path: \/api/)).toBeInTheDocument();
  expect(screen.getByText(/https:\/\/example\.com\/api/)).toBeInTheDocument();
  expect(screen.getByText(/api-service:8080/)).toBeInTheDocument();
});
