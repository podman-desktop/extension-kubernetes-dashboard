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

import type { V1Container } from '@kubernetes/client-node';
import { SvelteMap } from 'svelte/reactivity';
import { ansi256Colours, colourizedANSIContainerName } from '/@/component/terminal/terminal-colors';

export class MultiContainersLogsHelper {
  #containersCount: number;
  #maxNameLength: number;

  // Create a map that will store the ANSI 256 color for each container name
  // if we run out of colors, we'll start from the beginning.
  #colorizedContainerName = new SvelteMap<string, string>();

  init(containers: V1Container[]): void {
    this.#containersCount = containers.length;
    this.#maxNameLength = 0;

    if (this.#containersCount > 1) {
      this.#maxNameLength = Math.max(...containers.map(container => container.name.length));
      this.#colorizedContainerName = containers.reduce((acc, container, index) => {
        const color = ansi256Colours[index % ansi256Colours.length];
        acc.set(container.name, colourizedANSIContainerName(container.name, color));
        return acc;
      }, new SvelteMap<string, string>());
    }
  }

  transform(containerName: string, data: string): string {
    if (this.#containersCount === 1) {
      return data;
    }
    const padding = ' '.repeat(this.#maxNameLength - containerName.length);
    const colorizedName = this.#colorizedContainerName.get(containerName);
    // All lines are prefixed, except the last one if it's empty.
    return data
      .split('\n')
      .map((line, index, arr) =>
        index < arr.length - 1 || line.length > 0 ? `${padding}${colorizedName}|${line}` : line,
      )
      .join('\n');
  }
}
