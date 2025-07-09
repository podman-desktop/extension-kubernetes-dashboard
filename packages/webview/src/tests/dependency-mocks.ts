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

import { vi } from 'vitest';
import * as svelte from 'svelte';
import { Navigator } from '/@/navigator';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';
import type { DependencyAccessor } from '/@/inject/dependency-accessor';

/** Build mocks for dependencies injected in context via inversify
 *
 * To be used for unit tests
 */
export class DependencyMocks {
  public navigator: Navigator = {
    navigateTo: vi.fn(),
    kubernetesResourcesURL: vi.fn(),
    kubernetesResourceURL: vi.fn(),
  } as unknown as Navigator;

  public kubernetesObjectUIHelper: KubernetesObjectUIHelper = {
    isNamespaced: vi.fn(),
  } as unknown as KubernetesObjectUIHelper;

  constructor() {
    const dependencyAccessorMock: DependencyAccessor = {
      get: vi.fn(),
    } as unknown as DependencyAccessor;
    vi.spyOn(svelte, 'getContext').mockReturnValue(dependencyAccessorMock);

    vi.mocked(dependencyAccessorMock.get).mockImplementation(obj => {
      if (obj === Navigator) {
        return this.navigator;
      } else if (obj === KubernetesObjectUIHelper) {
        return this.kubernetesObjectUIHelper;
      }
    });
  }
}
