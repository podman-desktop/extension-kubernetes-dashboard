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

import { beforeEach, expect, test, vi } from 'vitest';
import { StatesMocks } from '/@/tests/context-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { UpdateResourceOptions } from '/@common/model/update-resource-options';
import type { UpdateResourceInfo } from '/@common/model/update-resource-info';
import type { CurrentContextInfo } from '/@common/model/current-context-info';
import { render, screen } from '@testing-library/svelte';
import ConfigsList from './ConfigsList.svelte';
import { tick } from 'svelte';
import { DependencyMocks } from '/@/tests/dependency-mocks';
import { Navigator } from '/@/navigation/navigator';

const statesMocks = new StatesMocks();
const dependencyMocks = new DependencyMocks();
let updateResourceMock: FakeStateObject<UpdateResourceInfo, UpdateResourceOptions>;
let currentContextMock: FakeStateObject<CurrentContextInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  updateResourceMock = new FakeStateObject();
  currentContextMock = new FakeStateObject();

  dependencyMocks.reset();
  dependencyMocks.mock(Navigator);

  statesMocks.reset();
  statesMocks.mock<UpdateResourceInfo, UpdateResourceOptions>('stateUpdateResourceInfoUI', updateResourceMock);
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
});

test('with no current context', () => {
  currentContextMock.setData({});
  render(ConfigsList);
  expect(currentContextMock.subscribe).toHaveBeenCalled();
  expect(screen.queryByText(/List of/)).toBeNull();
  expect(updateResourceMock.subscribe).not.toHaveBeenCalled();
});

test('with current context and resources', async () => {
  vi.mocked(dependencyMocks.get(Navigator).kubernetesResourcesURL).mockReturnValue('Link...');
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  updateResourceMock.setData({
    resources: [
      {
        contextName: 'ctx1',
        resourceName: 'configmaps',
        items: [{ metadata: { name: 'cm1' } }, { metadata: { name: 'cm2' } }],
      },
      {
        contextName: 'ctx1',
        resourceName: 'secrets',
        items: [{ metadata: { name: 'secret1_1' } }],
      },
      {
        contextName: 'ctx1',
        resourceName: 'pods',
        items: [],
      },
      {
        contextName: 'ctx2',
        resourceName: 'secrets',
        items: [{ metadata: { name: 'secret2_1' } }],
      },
    ],
  });
  render(ConfigsList);
  expect(currentContextMock.subscribe).toHaveBeenCalled();
  expect(updateResourceMock.subscribe).toHaveBeenCalledTimes(2);
  expect(updateResourceMock.subscribe).toHaveBeenCalledWith({
    contextName: 'ctx1',
    resourceName: 'configmaps',
  });
  expect(updateResourceMock.subscribe).toHaveBeenCalledWith({
    contextName: 'ctx1',
    resourceName: 'secrets',
  });

  screen.getByText('context: ctx1');

  screen.getByText('List of configmaps in context ctx1');
  screen.getByText('cm1 (Link...)');
  screen.getByText('cm2 (Link...)');
  screen.getByText('List of secrets in context ctx1');
  screen.getByText('secret1_1 (Link...)');
  expect(screen.queryByText('List of pods in context ctx1')).toBeNull();
  expect(screen.queryByText('List of secrets in context ctx2')).toBeNull();
  expect(screen.queryByText(/secret2_1/)).toBeNull();

  // change current context

  currentContextMock.setData({
    contextName: 'ctx2',
  });

  await tick();

  screen.getByText('context: ctx2');

  screen.getByText('List of secrets in context ctx2');
  screen.getByText('secret2_1 (Link...)');
  expect(screen.queryByText('List of configmaps in context ctx1')).toBeNull();
  expect(screen.queryByText(/cm1/)).toBeNull();
  expect(screen.queryByText(/cm2/)).toBeNull();
  expect(screen.queryByText('List of secrets in context ctx1')).toBeNull();
  expect(screen.queryByText(/secret1_1/)).toBeNull();
  expect(screen.queryByText('List of pods in context ctx1')).toBeNull();
});
