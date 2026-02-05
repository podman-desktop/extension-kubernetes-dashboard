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

/* eslint-disable sonarjs/cognitive-complexity */

export const KEY_COLOR = '\u001b[34;1m';
export const VALUE_COLOR = '\u001b[32m';
export const NOCOLOR = '\u001b[0m';

// Code inspired from https://github.com/csquared/node-logfmt/blob/6c3c61fcf5b8fdea1bca2ddac60367f616979dfd/lib/logfmt_parser.js
// MIT License: https://opensource.org/license/mit

export function logfmtColorize(line: string, indent: number = 0): string {
  let key: string | boolean = '';
  let value: string | boolean | undefined = '';
  let in_key = false;
  let in_value = false;
  let in_quote = false;
  let had_quote = false;

  if (line[line.length - 1] === '\n') {
    line = line.slice(0, line.length - 1);
  }

  let result = '';

  for (let i = 0; i <= line.length; i++) {
    if ((line[i] === ' ' && !in_quote) || i === line.length) {
      if (in_key && key.length > 0) {
        result += KEY_COLOR + key + NOCOLOR + (indent > 0 ? '\n' + ' '.repeat(indent) : ' ');
      } else if (in_value) {
        if (had_quote) {
          result +=
            '="' +
            (value !== '' ? VALUE_COLOR + value + NOCOLOR : '') +
            '"' +
            (indent > 0 ? '\n' + ' '.repeat(indent) : ' ');
        } else {
          result +=
            '=' + (value !== '' ? VALUE_COLOR + value + NOCOLOR : '') + (indent > 0 ? '\n' + ' '.repeat(indent) : ' ');
        }
        value = '';
      }

      if (i === line.length) break;
      else {
        in_key = false;
        in_value = false;
        in_quote = false;
        had_quote = false;
      }
    }

    if (line[i] === '=' && !in_quote) {
      //split
      in_key = false;
      in_value = true;
      result += KEY_COLOR + key + NOCOLOR;
    } else if (line[i] === '\\') {
      // eslint-disable-next-line sonarjs/updated-loop-counter
      i++;
      value += line[i];
    } else if (line[i] === '"') {
      had_quote = true;
      in_quote = !in_quote;
    } else if (line[i] !== ' ' && !in_value && !in_key) {
      in_key = true;
      key = line[i];
    } else if (in_key) {
      key += line[i];
    } else if (in_value) {
      value += line[i];
    }
  }
  return result.trimEnd();
}
