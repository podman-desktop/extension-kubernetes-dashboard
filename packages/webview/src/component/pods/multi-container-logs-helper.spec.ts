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

import { beforeEach, expect, test, vi } from 'vitest';
import { MultiContainersLogsHelper } from '/@/component/pods/multi-container-logs-helper';

beforeEach(() => {
  vi.resetAllMocks();
});

test('should transform logs for multiple containers', () => {
  const helper = new MultiContainersLogsHelper();
  helper.init([{ name: 'cnt1' }, { name: 'container2' }]);
  const result1 = helper.transform('cnt1', 'line 1\nline 2\nline 3\n');
  expect(result1).toEqual(
    '      \u001b[36mcnt1\u001b[0m|line 1\n      \u001b[36mcnt1\u001b[0m|line 2\n      \u001b[36mcnt1\u001b[0m|line 3\n',
  );
  const result2 = helper.transform('container2', 'other logs');
  expect(result2).toEqual('\u001b[33mcontainer2\u001b[0m|other logs');
});

test('should not transform logs for single container', () => {
  const helper = new MultiContainersLogsHelper();
  helper.init([{ name: 'cnt1' }]);
  const result1 = helper.transform('cnt1', 'line 1\nline 2\nline 3\n');
  expect(result1).toEqual('line 1\nline 2\nline 3\n');
});
