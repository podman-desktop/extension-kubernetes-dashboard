/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
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

import type { V1Ingress } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import IngressRouteDetailsSummary from './IngressRouteDetailsSummary.svelte';
import type { V1Route, SystemApi } from '@kubernetes-dashboard/channels';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';

const ingress: V1Ingress = {
  metadata: {
    name: 'my-ingress',
    namespace: 'default',
  },
  status: {},
};

const route: V1Route = {
  metadata: {
    name: 'my-route',
    namespace: 'default',
  },
  spec: {
    host: '',
    port: undefined,
    path: undefined,
    tls: {
      insecureEdgeTerminationPolicy: '',
      termination: '',
    },
    to: {
      kind: '',
      name: '',
      weight: 0,
    },
    wildcardPolicy: '',
  },
};

const remoteMocks = new RemoteMocks();

beforeEach(() => {
  vi.resetAllMocks();
  remoteMocks.reset();
  remoteMocks.mock(API_SYSTEM, {
    openExternal: vi.fn(),
  } as unknown as SystemApi);
});

test('Expect basic ingress rendering', async () => {
  render(IngressRouteDetailsSummary, { object: ingress });

  expect(screen.getByText('my-ingress')).toBeInTheDocument();
});

test('Expect basic route rendering', async () => {
  render(IngressRouteDetailsSummary, { object: route });

  expect(screen.getByText('my-route')).toBeInTheDocument();
});

test('Check more ingress properties', async () => {
  render(IngressRouteDetailsSummary, { object: ingress });

  expect(screen.getByText('my-ingress')).toBeInTheDocument();
  expect(screen.getByText('default')).toBeInTheDocument();
});

test('Check more route properties', async () => {
  render(IngressRouteDetailsSummary, { object: route });

  expect(screen.getByText('my-route')).toBeInTheDocument();
  expect(screen.getByText('default')).toBeInTheDocument();
});
