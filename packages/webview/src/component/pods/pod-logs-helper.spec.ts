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

import { beforeEach, expect, test, vi } from 'vitest';
import { PodLogsHelper } from '/@/component/pods/pod-logs-helper';
import { MultiContainersLogsHelper } from '/@/component/pods/multi-container-logs-helper';

beforeEach(() => {
  vi.resetAllMocks();
});

test('should colorize content and container name', () => {
  // we are just testing one case of log level, to be sure the helper is called, the rest is tested in the specs of logs level colorization.
  const multiContainersLogsHelper = new MultiContainersLogsHelper();
  const helper = new PodLogsHelper(multiContainersLogsHelper);
  helper.init([{ name: 'cnt1' }, { name: 'container2' }], 'log level colors');

  const result1 = helper.transformPodLogs('cnt1', 'line before\n[ERROR] some logs\nline after\n');
  expect(result1).toEqual(`      \u001b[36mcnt1\u001b[0m|line before
      \u001b[36mcnt1\u001b[0m|\u001b[31;1m[ERROR]\u001b[0m some logs
      \u001b[36mcnt1\u001b[0m|line after
`);
});

test('should colorize container name but no content', () => {
  // we are just testing one case of log level, to be sure the helper is called, the rest is tested in the specs of logs level colorization.
  const multiContainersLogsHelper = new MultiContainersLogsHelper();
  const helper = new PodLogsHelper(multiContainersLogsHelper);
  helper.init([{ name: 'cnt1' }, { name: 'container2' }], 'no colors');

  const result1 = helper.transformPodLogs('cnt1', 'line before\n[ERROR] some logs\nline after\n');
  expect(result1).toEqual(`      \u001b[36mcnt1\u001b[0m|line before
      \u001b[36mcnt1\u001b[0m|[ERROR] some logs
      \u001b[36mcnt1\u001b[0m|line after
`);
});

test('should resolve undefined as default colorizer', () => {
  const multiContainersLogsHelper = new MultiContainersLogsHelper();
  const helper = new PodLogsHelper(multiContainersLogsHelper);
  const result = helper.resolveColorizer();
  expect(result).toEqual('log level colors');
});

test('should resolve unknown colorizer as default colorizer', () => {
  const multiContainersLogsHelper = new MultiContainersLogsHelper();
  const helper = new PodLogsHelper(multiContainersLogsHelper);
  const result = helper.resolveColorizer('unknown colorizer');
  expect(result).toEqual('log level colors');
});

test('should resolve known colorizer as itself', () => {
  const multiContainersLogsHelper = new MultiContainersLogsHelper();
  const helper = new PodLogsHelper(multiContainersLogsHelper);
  const result = helper.resolveColorizer('no colors');
  expect(result).toEqual('no colors');
});
