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

import { describe, expect, test } from 'vitest';
import { Annotations, type AnnotationsMap } from './annotations';

class AnnotationsTest extends Annotations {
  public filterByDomain(annotations: AnnotationsMap, domain: string): AnnotationsMap {
    return super.filterByDomain(annotations, domain);
  }
  public filterByKey(annotations: AnnotationsMap, key: string): AnnotationsMap {
    return super.filterByKey(annotations, key);
  }
}
describe('Annotations', () => {
  test('undefined annotations map gives empty result, not undefined', () => {
    const annotations = new AnnotationsTest();
    const annotationsKey1 = annotations.getAnnotations(undefined, { key: 'key1' });
    expect(annotationsKey1).toEqual({});
  });

  test('should filter annotations by domain', () => {
    const annotations = new AnnotationsTest();
    const annotationsMap = {
      'kubernetes-dashboard.podman-desktop.io/key1.container1': 'value1',
      'kubernetes-dashboard.podman-desktop.io/key2': 'value2',
      'other-domain.example.com/key3': 'value3',
      key4: 'value4',
    };
    const domainAnnotations = annotations.filterByDomain(annotationsMap, 'kubernetes-dashboard.podman-desktop.io');
    expect(domainAnnotations).toEqual({
      'key1.container1': 'value1',
      key2: 'value2',
    });
    expect(annotations.filterByKey(domainAnnotations, 'key1')).toEqual({
      'key1.container1': 'value1',
    });
    expect(annotations.filterByKey(domainAnnotations, 'key2')).toEqual({
      key2: 'value2',
    });

    const directAnnotationsKey1 = annotations.getAnnotations({ annotations: annotationsMap }, { key: 'key1' });
    expect(directAnnotationsKey1).toEqual({ 'key1.container1': 'value1' });
    const directAnnotationsKey2 = annotations.getAnnotations({ annotations: annotationsMap }, { key: 'key2' });
    expect(directAnnotationsKey2).toEqual({ key2: 'value2' });
  });
});
