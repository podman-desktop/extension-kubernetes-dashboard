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

import { beforeEach, describe, expect, test } from 'vitest';

import { KubernetesApiValidator } from './kubernetes-api-validator.js';

let validator: KubernetesApiValidator;

beforeEach(() => {
  validator = new KubernetesApiValidator();
});

describe('validateGroupVersion', () => {
  test.each(['v1', 'apps/v1', 'batch/v1', 'networking.k8s.io/v1', 'rbac.authorization.k8s.io/v1beta1'])(
    'accepts valid groupVersion %s',
    (gv: string) => {
      expect(() => validator.validateGroupVersion(gv)).not.toThrow();
    },
  );

  test.each([
    '../../api/v1/secrets',
    '../api/v1/namespaces/kube-system/secrets',
    'apps/../v1/secrets',
    './v1',
    '',
    'apps/',
    '/v1',
  ])('rejects invalid groupVersion %s', (gv: string) => {
    expect(() => validator.validateGroupVersion(gv)).toThrow('invalid groupVersion');
  });
});
