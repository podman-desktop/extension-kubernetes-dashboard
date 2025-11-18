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

import { injectable } from 'inversify';
import * as podmanDesktopApi from '@podman-desktop/api';
import { NavigationApi } from '@kubernetes-dashboard/channels/dist/interface/navigation-api';

@injectable()
export class NavigationApiImpl implements NavigationApi {
  async navigateToProviderNewConnection(id: string): Promise<void> {
    // This test can be removed when the minimal version is set to 1.23
    if (!('navigateToCreateProviderConnection' in podmanDesktopApi.navigation)) {
      console.warn(
        'navigating to provider page is not supported in this version of Podman Desktop, please upgrade to the latest version',
      );
      return;
    }
    return podmanDesktopApi.navigation.navigateToCreateProviderConnection(id);
  }

  async navigateToExtensionsCatalog(searchTerm?: string): Promise<void> {
    // This test can be removed when the minimal version is set to 1.23
    if (!('navigateToExtensionsCatalog' in podmanDesktopApi.navigation)) {
      console.warn(
        'navigating to extensions catalog is not supported in this version of Podman Desktop, please upgrade to the latest version',
      );
      return;
    }
    return podmanDesktopApi.navigation.navigateToExtensionsCatalog({ searchTerm });
  }
}
