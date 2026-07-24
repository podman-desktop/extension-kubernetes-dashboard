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

import type { V1MutatingWebhookConfiguration } from '@kubernetes/client-node';
import { beforeEach, expect, test, vi } from 'vitest';

import { MutatingWebhookHelper } from './mutating-webhook-helper';

let helper: MutatingWebhookHelper;

beforeEach(() => {
  vi.clearAllMocks();
  helper = new MutatingWebhookHelper();
});

test('expect basic UI conversion', async () => {
  const obj = {
    metadata: {
      name: 'my-mutating-webhook',
      uid: 'uid-mw',
    },
    webhooks: [],
  } as V1MutatingWebhookConfiguration;
  const ui = helper.getMutatingWebhookUI(obj);
  expect(ui.kind).toEqual('MutatingWebhookConfiguration');
  expect(ui.name).toEqual('my-mutating-webhook');
  expect(ui.uid).toEqual('uid-mw');
});

test('expect webhooks count', async () => {
  const obj = {
    metadata: { name: 'mw1' },
    webhooks: [
      { name: 'hook1', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'hook2', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'hook3', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
    ],
  } as V1MutatingWebhookConfiguration;
  const ui = helper.getMutatingWebhookUI(obj);
  expect(ui.webhooks).toEqual(3);
});

test('expect failurePolicy deduplication', async () => {
  const obj = {
    metadata: { name: 'mw2' },
    webhooks: [
      { name: 'h1', failurePolicy: 'Ignore', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'h2', failurePolicy: 'Ignore', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
      { name: 'h3', failurePolicy: 'Fail', clientConfig: {}, sideEffects: 'None', admissionReviewVersions: ['v1'] },
    ],
  } as V1MutatingWebhookConfiguration;
  const ui = helper.getMutatingWebhookUI(obj);
  expect(ui.failurePolicy).toEqual('Ignore, Fail');
});
