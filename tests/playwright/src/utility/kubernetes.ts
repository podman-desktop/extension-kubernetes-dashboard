/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

import { execSync } from 'node:child_process';

import test from '@playwright/test';

export async function createKubernetesResource(resourceYamlPath: string): Promise<void> {
  return test.step(`Create kubernetes resources from yaml`, async () => {
    // test kubectl is present
    try {
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      const version = execSync('kubectl version').toString();
      console.log(`Kubectl version stdout: ${version}`);
    } catch (error) {
      throw new Error(`Kubectl is not installed: ${error}`, {
        cause: error,
      });
    }
    try {
      // eslint-disable-next-line sonarjs/os-command
      const kubectlApply = execSync(`kubectl apply -f ${resourceYamlPath}`).toString();
      console.log(`Kube yaml ${resourceYamlPath} applied successfully via cli: ${kubectlApply}`);
    } catch (error) {
      throw new Error(`Error encountered when trying to apply kube yaml: ${error}`, {
        cause: error,
      });
    }
  });
}
