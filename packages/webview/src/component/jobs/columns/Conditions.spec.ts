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

import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import type { JobCondition, JobUI } from '/@/component/jobs/JobUI';
import Conditions from './Conditions.svelte';

function createJobUI(condition: JobCondition): JobUI {
  return {
    kind: 'Job',
    uid: '456',
    name: 'my-job',
    status: '',
    namespace: '',
    condition,
    succeeded: 0,
    completions: 0,
    selected: false,
  };
}

test.each([
  ['completed', 'Completed', 'text-(--pd-status-running)'],
  ['failed', 'Failed', 'text-(--pd-status-dead)'],
  ['running', 'Running', 'text-(--pd-status-running)'],
  ['pending', 'Pending', 'text-(--pd-status-starting)'],
  ['unknown', 'Unknown', 'text-(--pd-status-degraded)'],
] as [JobCondition, string, string][])('Expect column styling %s', async (condition, expectedText, expectedClass) => {
  const job = createJobUI(condition);
  render(Conditions, { object: job });

  const text = screen.getByText(expectedText);
  expect(text).toBeInTheDocument();

  const svg = text.parentElement?.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveClass(expectedClass);
});
