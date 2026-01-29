/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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
import type { V1ObjectMeta } from '@kubernetes/client-node';

export type AnnotationsMap = { [key: string]: string };

export interface GetAnnotationOptions {
  key: string;
}

@injectable()
export class Annotations {
  #domain = 'kubernetes-dashboard.podman-desktop.io';

  public getAnnotations(metadata: V1ObjectMeta | undefined, options: GetAnnotationOptions): AnnotationsMap {
    return this.filterByKey(this.filterByDomain(metadata?.annotations ?? {}, this.#domain), options.key);
  }

  // filter annotations by domain and REMOVE domain prefix
  protected filterByDomain(annotations: AnnotationsMap, domain: string): AnnotationsMap {
    return Object.fromEntries(
      Object.entries(annotations)
        .filter(([key]) => key.startsWith(`${domain}/`))
        .map(([key, value]) => [key.replace(`${domain}/`, ''), value]),
    );
  }

  // filter annotations by key and KEEP domain prefix
  protected filterByKey(annotations: AnnotationsMap, key: string): AnnotationsMap {
    return Object.fromEntries(Object.entries(annotations).filter(([k]) => k.startsWith(`${key}.`) || k === key));
  }
}
