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

import type { V1ValidatingWebhookConfiguration } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { ValidatingWebhookHelper } from './validating-webhook-helper';

let helper: ValidatingWebhookHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new ValidatingWebhookHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      name: 'my-validating-webhook',
      uid: 'uid-vw',
    },
    webhooks: [],
  } as V1ValidatingWebhookConfiguration;
  const ui = helper.getValidatingWebhookUI(obj);
  expect(ui.kind).toEqual('ValidatingWebhookConfiguration');
  expect(ui.name).toEqual('my-validating-webhook');
  expect(ui.uid).toEqual('uid-vw');
});

test('expect webhooks count', async () => {
  const obj = {
    metadata: { name: 'vw1' },
    webhooks: [
      { name: 'hook1', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'hook2', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
    ],
  } as V1ValidatingWebhookConfiguration;
  const ui = helper.getValidatingWebhookUI(obj);
  expect(ui.webhooks).toEqual(2);
});

test('expect failurePolicy from webhooks', async () => {
  const obj = {
    metadata: { name: 'vw2' },
    webhooks: [
      { name: 'h1', failurePolicy: 'Fail', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'h2', failurePolicy: 'Ignore', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
    ],
  } as V1ValidatingWebhookConfiguration;
  const ui = helper.getValidatingWebhookUI(obj);
  expect(ui.failurePolicy).toEqual('Fail, Ignore');
});
