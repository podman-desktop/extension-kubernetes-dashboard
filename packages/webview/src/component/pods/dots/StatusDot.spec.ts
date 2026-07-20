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
import { beforeEach, expect, test, vi } from 'vitest';

import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import StatusDot from './StatusDot.svelte';

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();
  dependencyMocks.reset();
  dependencyMocks.mock(KubernetesObjectUIHelper);
});

test.each([
  ['running', 'bg-(--pd-status-running)'],
  ['terminated', 'bg-(--pd-status-terminated)'],
  ['waiting', 'bg-(--pd-status-waiting)'],
  ['stopped', 'outline-(--pd-status-stopped)'],
  ['paused', 'bg-(--pd-status-paused)'],
  ['exited', 'outline-(--pd-status-exited)'],
  ['dead', 'bg-(--pd-status-dead)'],
  ['created', 'outline-(--pd-status-created)'],
  ['degraded', 'bg-(--pd-status-degraded)'],
  ['unknown', 'bg-(--pd-status-unknown)'],
])('Expect the dot to have the correct color for %s status', (containerStatus, expectedClass) => {
  render(StatusDot, { name: 'foobar', status: containerStatus });
  const dot = screen.getByTestId('status-dot');
  expect(dot).toHaveClass(expectedClass);
});
