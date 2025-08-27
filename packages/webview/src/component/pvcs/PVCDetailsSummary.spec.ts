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

import type { V1PersistentVolumeClaim } from '@kubernetes/client-node';
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import PVCDetailsSummary from './PVCDetailsSummary.svelte';

const pvc: V1PersistentVolumeClaim = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name: 'my-pvc',
    namespace: 'default',
  },
} as V1PersistentVolumeClaim;

test('Expect to render PVC details when PVC data is available', async () => {
  render(PVCDetailsSummary, { props: { object: pvc, events: [] } });

  expect(screen.getByText('my-pvc')).toBeInTheDocument();
});
