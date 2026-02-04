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

import { expect, test } from 'vitest';
import { logfmtColorize, KEY_COLOR, NOCOLOR, VALUE_COLOR } from '/@/component/terminal/logfmt-colorizer';

test('should colorize logfmt line with indent', () => {
  const line = 'true_key null_value= key1=value1 key2="value 2" empty=""';
  const result = logfmtColorize(line, 2);
  expect(result).toEqual(
    `${KEY_COLOR}true_key${NOCOLOR}
  ${KEY_COLOR}null_value${NOCOLOR}=
  ${KEY_COLOR}key1${NOCOLOR}=${VALUE_COLOR}value1${NOCOLOR}
  ${KEY_COLOR}key2${NOCOLOR}="${VALUE_COLOR}value 2${NOCOLOR}"
  ${KEY_COLOR}empty${NOCOLOR}=""`,
  );
});

test('should colorize logfmt line without indent', () => {
  const line = 'true_key null_value= key1=value1 key2="value 2" empty=""';
  const result = logfmtColorize(line);
  expect(result).toEqual(
    `${KEY_COLOR}true_key${NOCOLOR} ${KEY_COLOR}null_value${NOCOLOR}= ${KEY_COLOR}key1${NOCOLOR}=${VALUE_COLOR}value1${NOCOLOR} ${KEY_COLOR}key2${NOCOLOR}="${VALUE_COLOR}value 2${NOCOLOR}" ${KEY_COLOR}empty${NOCOLOR}=""`,
  );
});
