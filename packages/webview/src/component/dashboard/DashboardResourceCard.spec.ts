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

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import KubernetesDashboardResourceCard from './DashboardResourceCard.svelte';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import { StatesMocks } from '/@/tests/context-mocks';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import type { ActiveResourcesCountInfo } from '/@common/model/active-resources-count-info';
import type { ResourcesCountInfo } from '/@common/model/resources-count-info';
import type { ContextsPermissionsInfo } from '/@common/model/contexts-permissions-info';
import { Navigator } from '/@/navigation/navigator';

const statesMocks = new StatesMocks();
const dependencyMocks = new DependencyMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let activeResourcesCountMock: FakeStateObject<ActiveResourcesCountInfo, void>;
let resourcesCountMock: FakeStateObject<ResourcesCountInfo, void>;
let contextsPermissionsMock: FakeStateObject<ContextsPermissionsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  currentContextMock = new FakeStateObject();
  activeResourcesCountMock = new FakeStateObject();
  resourcesCountMock = new FakeStateObject();
  contextsPermissionsMock = new FakeStateObject();

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<ActiveResourcesCountInfo, void>('stateActiveResourcesCountInfoUI', activeResourcesCountMock);
  statesMocks.mock<ResourcesCountInfo, void>('stateResourcesCountInfoUI', resourcesCountMock);
  statesMocks.mock<ContextsPermissionsInfo, void>('stateContextsPermissionsInfoUI', contextsPermissionsMock);

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);
});

describe('all resources permitted', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    activeResourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 1 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 2 },
        { contextName: 'ctx2', resourceName: 'seals', count: 3 },
      ],
    });
    resourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 11 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 12 },
        { contextName: 'ctx2', resourceName: 'seals', count: 13 },
      ],
    });
    contextsPermissionsMock.setData({
      permissions: [
        { contextName: 'ctx1', resourceName: 'seals', permitted: true, reason: undefined },
        { contextName: 'ctx1', resourceName: 'dolphins', permitted: true, reason: undefined },
        { contextName: 'ctx2', resourceName: 'seals', permitted: false, reason: 'because' },
      ],
    });
  });

  test('basic card format', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    const type = screen.getByText('Seals and Dolphins');
    expect(type).toHaveClass('text-[var(--pd-invert-content-card-text)]');
    expect(type).toHaveClass('font-semibold');

    const activeCount = screen.getByLabelText('Seals and Dolphins active count');
    expect(activeCount).toHaveTextContent('3');
    expect(activeCount).toHaveClass('text-2xl');
    expect(activeCount).toHaveClass('text-[var(--pd-invert-content-card-text)]');

    const count = screen.getByLabelText('Seals and Dolphins count');
    expect(count).toHaveTextContent('23');
    expect(count).toHaveClass('text-2xl');
    expect(count).toHaveClass('text-[var(--pd-invert-content-card-text)]');
  });
});

describe('one resource permitted', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    activeResourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 1 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 0 },
        { contextName: 'ctx2', resourceName: 'seals', count: 0 },
      ],
    });
    resourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 11 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 0 },
        { contextName: 'ctx2', resourceName: 'seals', count: 0 },
      ],
    });
    contextsPermissionsMock.setData({
      permissions: [
        { contextName: 'ctx1', resourceName: 'seals', permitted: true, reason: undefined },
        { contextName: 'ctx1', resourceName: 'dolphins', permitted: false, reason: 'because' },
        { contextName: 'ctx2', resourceName: 'seals', permitted: false, reason: 'because' },
      ],
    });
  });

  test('basic card format', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    const type = screen.getByText('Seals and Dolphins');
    expect(type).toHaveClass('text-[var(--pd-invert-content-card-text)]');
    expect(type).toHaveClass('font-semibold');

    const activeCount = screen.getByLabelText('Seals and Dolphins active count');
    expect(activeCount).toHaveTextContent('1');
    expect(activeCount).toHaveClass('text-2xl');
    expect(activeCount).toHaveClass('text-[var(--pd-invert-content-card-text)]');

    const count = screen.getByLabelText('Seals and Dolphins count');
    expect(count).toHaveTextContent('11');
    expect(count).toHaveClass('text-2xl');
    expect(count).toHaveClass('text-[var(--pd-invert-content-card-text)]');
  });
});

describe('one resource permitted, resource cannot be active', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    activeResourcesCountMock.setData({
      counts: [],
    });
    resourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 11 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 0 },
        { contextName: 'ctx2', resourceName: 'seals', count: 0 },
      ],
    });
    contextsPermissionsMock.setData({
      permissions: [
        { contextName: 'ctx1', resourceName: 'seals', permitted: true, reason: undefined },
        { contextName: 'ctx1', resourceName: 'dolphins', permitted: false, reason: 'because' },
        { contextName: 'ctx2', resourceName: 'seals', permitted: false, reason: 'because' },
      ],
    });
  });

  test('basic card format', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    const type = screen.getByText('Seals and Dolphins');
    expect(type).toHaveClass('text-[var(--pd-invert-content-card-text)]');
    expect(type).toHaveClass('font-semibold');

    expect(screen.queryByLabelText('Seals and Dolphins active count')).toBeNull();

    const count = screen.getByLabelText('Seals and Dolphins count');
    expect(count).toHaveTextContent('11');
    expect(count).toHaveClass('text-2xl');
    expect(count).toHaveClass('text-[var(--pd-invert-content-card-text)]');
  });

  test('clicking on the card', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(dependencyMocks.get<Navigator>(Navigator).navigateTo).toHaveBeenCalledWith({ kind: 'Seal' });
  });
});

describe('no resource permitted', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    activeResourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 1 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 0 },
        { contextName: 'ctx2', resourceName: 'seals', count: 0 },
      ],
    });
    resourcesCountMock.setData({
      counts: [
        { contextName: 'ctx1', resourceName: 'seals', count: 0 },
        { contextName: 'ctx1', resourceName: 'dolphins', count: 0 },
        { contextName: 'ctx2', resourceName: 'seals', count: 0 },
      ],
    });
    contextsPermissionsMock.setData({
      permissions: [
        { contextName: 'ctx1', resourceName: 'seals', permitted: false, reason: 'because' },
        { contextName: 'ctx1', resourceName: 'dolphins', permitted: false, reason: 'because' },
        { contextName: 'ctx2', resourceName: 'seals', permitted: false, reason: 'because' },
      ],
    });
  });

  test('basic card format', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-60');

    const type = screen.getByText('Seals and Dolphins');
    expect(type).toHaveClass('text-[var(--pd-invert-content-card-text)]');
    expect(type).toHaveClass('font-semibold');

    const activeCount = screen.getByLabelText('Seals and Dolphins active count');
    expect(activeCount).toHaveTextContent('-');
    expect(activeCount).toHaveClass('text-2xl');
    expect(activeCount).toHaveClass('text-[var(--pd-invert-content-card-text)]');

    const count = screen.getByLabelText('Seals and Dolphins count');
    expect(count).toHaveTextContent('-');
    expect(count).toHaveClass('text-2xl');
    expect(count).toHaveClass('text-[var(--pd-invert-content-card-text)]');
  });

  test('clicking on the card', async () => {
    render(KubernetesDashboardResourceCard, {
      type: 'Seals and Dolphins',
      resources: ['seals', 'dolphins'],
      kind: 'Seal',
    });

    // navigation is possible when not permitted
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(dependencyMocks.get<Navigator>(Navigator).navigateTo).toHaveBeenCalledWith({ kind: 'Seal' });
  });
});
