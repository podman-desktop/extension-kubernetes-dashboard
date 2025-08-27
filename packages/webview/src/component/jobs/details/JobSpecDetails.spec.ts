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

import type { V1JobSpec } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import JobSpecDetails from './JobSpecDetails.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

const fakeJobSpec: V1JobSpec = {
  parallelism: 3,
  completions: 5,
  backoffLimit: 6,
  activeDeadlineSeconds: 120,
  ttlSecondsAfterFinished: 60,
  suspend: false,
} as V1JobSpec;

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(KubernetesObjectUIHelper);
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).capitalize).mockImplementation(
    value => value.charAt(0).toUpperCase() + value.slice(1),
  );
});

test('Renders Job correctly with complete data', () => {
  render(JobSpecDetails, { spec: fakeJobSpec });
  expect(screen.getByText('Parallelism')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('Completions')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
  expect(screen.getByText('Backoff Limit')).toBeInTheDocument();
  expect(screen.getByText('6')).toBeInTheDocument();
  expect(screen.getByText('Active Deadline Seconds')).toBeInTheDocument();
  expect(screen.getByText('120')).toBeInTheDocument();
  expect(screen.getByText('TTL Seconds After Finished')).toBeInTheDocument();
  expect(screen.getByText('60')).toBeInTheDocument();
  expect(screen.getByText('Suspend')).toBeInTheDocument();
  expect(screen.getByText('False')).toBeInTheDocument();
});
