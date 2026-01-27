/**********************************************************************
 * Copyright (C) 2025 - 2026Red Hat, Inc.
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

import type { V1Container } from '@kubernetes/client-node';
import { colorizeLogLevel } from '/@/component/terminal/terminal-colors';
import { MultiContainersLogsHelper } from '/@/component/pods/multi-container-logs-helper';
import { inject, injectable } from 'inversify';

@injectable()
export class PodLogsHelper {
  constructor(@inject(MultiContainersLogsHelper) private multiContainersLogsHelper: MultiContainersLogsHelper) {}

  #colorizerFunction: (data: string) => string;
  #colorizerFunctions: Record<string, (data: string) => string> = {
    'log level colors': colorizeLogLevel,
    'no colors': (data: string) => data,
  };

  init(containers: V1Container[], colorizer: string): void {
    if (!this.#colorizerFunctions[colorizer]) {
      throw new Error(`Invalid colorizer: ${colorizer}`);
    }
    this.#colorizerFunction = this.#colorizerFunctions[colorizer];
    this.multiContainersLogsHelper.init(containers);
  }

  transformPodLogs(containerName: string, data: string): string {
    const colorizedContent = data
      .split('\n')
      .map(line => this.#colorizerFunction(line))
      .join('\n');
    return this.multiContainersLogsHelper.transform(containerName, colorizedContent);
  }

  getColorizers(): string[] {
    return Object.keys(this.#colorizerFunctions);
  }

  // returns colorizer if found, otherwise returns default colorizer
  resolveColorizer(colorizer?: string): string {
    if (!colorizer || !this.#colorizerFunctions[colorizer]) {
      return this.getColorizers()[0];
    }
    return colorizer;
  }
}
