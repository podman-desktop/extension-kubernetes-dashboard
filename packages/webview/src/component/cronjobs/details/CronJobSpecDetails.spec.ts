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

import type { V1CronJobSpec } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';

import KubeCronJobArtifact from './CronJobSpecDetails.svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

const fakeCronJobSpec: V1CronJobSpec = {
  schedule: '*/5 * * * *',
  concurrencyPolicy: 'Forbid',
  failedJobsHistoryLimit: 1,
  successfulJobsHistoryLimit: 3,
  startingDeadlineSeconds: 30,
  suspend: false,
  timeZone: 'UTC',
  jobTemplate: {
    metadata: { name: 'example-job' },
  },
} as V1CronJobSpec;

const dependencyMocks = new DependencyMocks();

beforeEach(() => {
  vi.resetAllMocks();

  dependencyMocks.reset();
  dependencyMocks.mock(KubernetesObjectUIHelper);
  vi.mocked(dependencyMocks.get(KubernetesObjectUIHelper).capitalize).mockImplementation(
    value => value.charAt(0).toUpperCase() + value.slice(1),
  );
});

test('Renders CronJob correctly with complete data', () => {
  render(KubeCronJobArtifact, { spec: fakeCronJobSpec });
  expect(screen.getByText('Schedule')).toBeInTheDocument();
  expect(screen.getByText('*/5 * * * *')).toBeInTheDocument();
  expect(screen.getByText('Concurrency Policy')).toBeInTheDocument();
  expect(screen.getByText('Forbid')).toBeInTheDocument();
  expect(screen.getByText('Failed Jobs History Limit')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('Successful Jobs History Limit')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('Starting Deadline Seconds')).toBeInTheDocument();
  expect(screen.getByText('30')).toBeInTheDocument();
  expect(screen.getByText('Suspend')).toBeInTheDocument();
  expect(screen.getByText('False')).toBeInTheDocument();
  expect(screen.getByText('Time Zone')).toBeInTheDocument();
  expect(screen.getByText('UTC')).toBeInTheDocument();
});
