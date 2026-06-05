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

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import type { SystemApi, V1HTTPRouteSpec } from '@kubernetes-dashboard/channels';
import { RemoteMocks } from '/@/tests/remote-mocks';
import HTTPRouteSpecDetails from './HTTPRouteSpecDetails.svelte';

const fakeHTTPRouteSpec: V1HTTPRouteSpec = {
  hostnames: ['example.com'],
  parentRefs: [
    {
      kind: 'Gateway',
      name: 'gateway1',
    },
  ],
  rules: [
    {
      matches: [
        {
          path: {
            type: 'PathPrefix',
            value: '/api',
          },
        },
      ],
      backendRefs: [
        {
          name: 'backend-service',
          port: 8080,
        },
      ],
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

test('Renders HTTPRoute details correctly', () => {
  render(HTTPRouteSpecDetails, { spec: fakeHTTPRouteSpec });

  expect(screen.getByText('Details')).toBeInTheDocument();
  expect(screen.getByText('Hostnames')).toBeInTheDocument();
  expect(screen.getByText('example.com')).toBeInTheDocument();
  expect(screen.getByText('Paths')).toBeInTheDocument();
  expect(screen.getByText('/api')).toBeInTheDocument();
  expect(screen.getByText('Parents')).toBeInTheDocument();
  expect(screen.getByText('Gateway gateway1')).toBeInTheDocument();
  expect(screen.getByText('Backends')).toBeInTheDocument();
  expect(screen.getByText('Service backend-service:8080')).toBeInTheDocument();
  expect(screen.getByText('Links')).toBeInTheDocument();
  expect(screen.getByText('http://example.com/api')).toBeInTheDocument();
});
