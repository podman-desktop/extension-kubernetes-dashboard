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

import type { DeploymentCondition, DeploymentUI } from '/@/component/deployments/DeploymentUI';
import Conditions from './Conditions.svelte';

function createDeploymentUI(conditions: DeploymentCondition[]): DeploymentUI {
  return {
    uid: '123',
    name: 'my-deployment',
    kind: 'Deployment',
    status: '',
    namespace: '',
    replicas: 0,
    ready: 0,
    selected: false,
    conditions: conditions,
  };
}

test.each([
  ['Available', 'MinimumReplicasAvailable', 'Available', 'text-(--pd-status-running)'],
  ['Available', 'MinimumReplicasUnavailable', 'Unavailable', 'text-(--pd-status-degraded)'],
  ['Progressing', 'ReplicaSetUpdated', 'Updated', 'text-(--pd-status-updated)'],
  ['Progressing', 'NewReplicaSetCreated', 'New Replica Set', 'text-(--pd-status-updated)'],
  ['Progressing', 'NewReplicaSetAvailable', 'Progressed', 'text-(--pd-status-running)'],
  ['Progressing', 'ReplicaSetScaledUp', 'Scaled Up', 'text-(--pd-status-updated)'],
  ['Progressing', 'ReplicaSetScaledDown', 'Scaled Down', 'text-(--pd-status-updated)'],
  ['Progressing', 'ProgressDeadlineExceeded', 'Deadline Exceeded', 'text-(--pd-status-dead)'],
  ['ReplicaFailure', 'ReplicaFailure', 'Replica Failure', 'text-(--pd-status-dead)'],
])('Expect column styling for %s/%s', async (type, reason, expectedText, expectedClass) => {
  const deployment = createDeploymentUI([{ type, message: 'Running fine', reason }]);
  render(Conditions, { object: deployment });

  const text = screen.getByText(expectedText);
  expect(text).toBeInTheDocument();

  const svg = text.parentElement?.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveClass(expectedClass);
});
