/**********************************************************************
 * Copyright (C) 2024, 2025 Red Hat, Inc.
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

import type { V1ObjectMeta, V1OwnerReference } from '@kubernetes/client-node';

export class MetadataExplorer {
  #metadata: V1ObjectMeta;

  constructor(metadata: V1ObjectMeta) {
    this.#metadata = metadata;
  }

  // getController returns the controller of the object, based on the ownerReferences field
  // and returning the first ownerReference with controller field set to true
  // returns undefined if there is no controller
  getController(): V1OwnerReference | undefined {
    return this.#metadata.ownerReferences?.find((ref: V1OwnerReference) => ref.controller === true);
  }

  // getUserOnlyMetadata returns the metadata of the object without data populated by the system
  getUserOnlyMetadata(): V1ObjectMeta {
    return this.copyExcludingUndefined(this.#metadata, ['name', 'generateName', 'namespace', 'labels', 'annotations']);
  }

  protected copyExcludingUndefined(obj: V1ObjectMeta, fields: (keyof V1ObjectMeta)[]): V1ObjectMeta {
    return Object.entries(obj).reduce((a, [k, v]) => {
      if (fields.includes(k as keyof V1ObjectMeta) && v !== undefined) {
        a[k as keyof V1ObjectMeta] = v;
      }
      return a;
    }, {} as V1ObjectMeta);
  }
}
