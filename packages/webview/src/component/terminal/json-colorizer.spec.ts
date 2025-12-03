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

import { describe, expect, test } from 'vitest';

import type { JsonColorScheme } from './json-colorizer.js';
import { detectJsonLogs, JsonColorizer } from './json-colorizer.js';

describe('JsonColorizer', () => {
  const colorScheme: JsonColorScheme = {
    braceColor: '\u001b[33m', // yellow
    numberColor: '\u001b[32m', // green
    booleanColor: '\u001b[35m', // magenta
    nullColor: '\u001b[35m', // magenta
    reset: '\u001b[0m',
  };

  const colorizer = new JsonColorizer(colorScheme);

  test.each([
    { jsonLine: '{"name": "test"}', open: '{', close: '}', desc: 'braces', strings: ['"name"', '"test"'] },
    { jsonLine: '["item1", "item2"]', open: '[', close: ']', desc: 'brackets', strings: ['"item1"', '"item2"'] },
    { jsonLine: '{}', open: '{', close: '}', desc: 'empty object', strings: [] },
    { jsonLine: '[]', open: '[', close: ']', desc: 'empty array', strings: [] },
  ])('should colorize $desc in yellow', ({ jsonLine, open, close, strings }) => {
    const result = colorizer.colorize(jsonLine);

    expect(result).toContain(`\u001b[33m${open}\u001b[0m`);
    expect(result).toContain(`\u001b[33m${close}\u001b[0m`);

    strings.forEach(str => expect(result).toContain(str));
  });

  test.each([
    {
      jsonLine: '{"count": 42, "price": 19.99}',
      type: 'number',
      coloredValues: ['\u001b[32m42\u001b[0m', '\u001b[32m19.99\u001b[0m'],
      keys: ['"count"', '"price"'],
    },
    {
      jsonLine: '{"enabled": true, "active": false}',
      type: 'boolean',
      coloredValues: ['\u001b[35mtrue\u001b[0m', '\u001b[35mfalse\u001b[0m'],
      keys: ['"enabled"', '"active"'],
    },
    {
      jsonLine: '{"value": null}',
      type: 'null',
      coloredValues: ['\u001b[35mnull\u001b[0m'],
      keys: ['"value"'],
    },
    {
      jsonLine: '{"value": 0}',
      type: 'zero',
      coloredValues: ['\u001b[32m0\u001b[0m'],
      keys: ['"value"'],
    },
    {
      jsonLine: '{"value": 0.5}',
      type: 'decimal',
      coloredValues: ['\u001b[32m0.5\u001b[0m'],
      keys: ['"value"'],
    },
    {
      jsonLine: '{"temperature": -15, "balance": -99.99}',
      type: 'negative number',
      coloredValues: ['\u001b[32m-15\u001b[0m', '\u001b[32m-99.99\u001b[0m'],
      keys: ['"temperature"', '"balance"'],
    },
  ])('should colorize JSON with $type values', ({ jsonLine, coloredValues, keys }) => {
    const result = colorizer.colorize(jsonLine);

    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    coloredValues.forEach(value => expect(result).toContain(value));
    keys.forEach(key => expect(result).toContain(key));
  });

  test.each([
    {
      jsonLine: '["item1", "item2", "item3"]',
      type: 'strings',
      expectedValues: ['"item1"', '"item2"', '"item3"'],
    },
    {
      jsonLine: '[1, 2, 3, 4.5]',
      type: 'numbers',
      expectedValues: [
        '\u001b[32m1\u001b[0m',
        '\u001b[32m2\u001b[0m',
        '\u001b[32m3\u001b[0m',
        '\u001b[32m4.5\u001b[0m',
      ],
    },
    {
      jsonLine: '[true, false, true]',
      type: 'booleans',
      expectedValues: ['\u001b[35mtrue\u001b[0m', '\u001b[35mfalse\u001b[0m'],
    },
  ])('should colorize JSON array with $type', ({ jsonLine, expectedValues }) => {
    const result = colorizer.colorize(jsonLine);

    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');

    expectedValues.forEach(value => expect(result).toContain(value));
  });

  test('should colorize complex nested JSON', () => {
    const jsonLine = '{"user": {"name": "John", "age": 30, "active": true}}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow (4 total: outer { }, inner { })
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Values should be appropriately colored
    expect(result).toContain('\u001b[32m30\u001b[0m');
    expect(result).toContain('\u001b[35mtrue\u001b[0m');

    // Strings should not be colorized
    expect(result).toContain('"user"');
    expect(result).toContain('"name"');
    expect(result).toContain('"age"');
    expect(result).toContain('"active"');
    expect(result).toContain('"John"');
  });

  test('should colorize JSON log level format', () => {
    const jsonLine = '{"timestamp":"123","level":"information","message":"test"}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Strings should not be colorized
    expect(result).toContain('"timestamp"');
    expect(result).toContain('"level"');
    expect(result).toContain('"message"');
    expect(result).toContain('"123"');
    expect(result).toContain('"information"');
    expect(result).toContain('"test"');
  });

  test('should colorize JSON with mixed types in array', () => {
    const jsonLine = '["text", 123, true, null]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');

    // Each type should be colorized appropriately
    expect(result).toContain('"text"'); // strings not colorized
    expect(result).toContain('\u001b[32m123\u001b[0m');
    expect(result).toContain('\u001b[35mtrue\u001b[0m');
    expect(result).toContain('\u001b[35mnull\u001b[0m');
  });

  test('should handle JSON with escaped quotes', () => {
    const jsonLine = '{"message": "He said \\"hello\\""}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Should handle escaped quotes properly - strings not colorized
    expect(result).toContain('"message"');
    expect(result).toContain('"He said \\"hello\\""');
  });

  test('should work with custom color scheme', () => {
    const customScheme: JsonColorScheme = {
      braceColor: '\u001b[31m', // red
      numberColor: '\u001b[33m', // yellow
      booleanColor: '\u001b[34m', // blue
      nullColor: '\u001b[35m', // magenta
      reset: '\u001b[0m',
    };

    const customColorizer = new JsonColorizer(customScheme);
    const jsonLine = '{"key": "value", "num": 42, "flag": true, "empty": null}';
    const result = customColorizer.colorize(jsonLine);

    // Should use custom colors
    expect(result).toContain('\u001b[31m{\u001b[0m'); // red braces
    expect(result).toContain('\u001b[31m}\u001b[0m'); // red braces
    expect(result).toContain('\u001b[33m42\u001b[0m'); // yellow number
    expect(result).toContain('\u001b[34mtrue\u001b[0m'); // blue boolean
    expect(result).toContain('\u001b[35mnull\u001b[0m'); // magenta null

    // Strings should not be colorized
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });
});

describe('detectJsonLogs', () => {
  test('should detect JSON logs when 80% or more lines are valid JSON', () => {
    const logs = [
      '{"timestamp":"2025-11-18T10:00:00Z","level":"info","message":"Starting application"}',
      '{"timestamp":"2025-11-18T10:00:01Z","level":"info","message":"Connected to database"}',
      '{"timestamp":"2025-11-18T10:00:02Z","level":"info","message":"Server listening on port 8080"}',
      '{"timestamp":"2025-11-18T10:00:03Z","level":"debug","message":"Request received"}',
      '{"timestamp":"2025-11-18T10:00:04Z","level":"debug","message":"Processing request"}',
      '{"timestamp":"2025-11-18T10:00:05Z","level":"info","message":"Request completed"}',
      '{"timestamp":"2025-11-18T10:00:06Z","level":"info","message":"Cache updated"}',
      '{"timestamp":"2025-11-18T10:00:07Z","level":"info","message":"Background job started"}',
      'Not a JSON line',
      '{"timestamp":"2025-11-18T10:00:08Z","level":"info","message":"Job completed"}',
    ];

    expect(detectJsonLogs(logs)).toBe(true);
  });

  test('should not detect JSON logs when less than 80% are valid JSON', () => {
    const logs = [
      '{"timestamp":"2025-11-18T10:00:00Z","level":"info","message":"Starting"}',
      '{"timestamp":"2025-11-18T10:00:01Z","level":"info","message":"Running"}',
      'Regular log line without JSON',
      'Another regular log line',
      'Yet another non-JSON line',
      'Still not JSON',
      'Nope, not JSON either',
      '{"timestamp":"2025-11-18T10:00:02Z","level":"info","message":"Done"}',
      'More regular logs',
      'Last regular log',
    ];

    expect(detectJsonLogs(logs)).toBe(false);
  });

  test('should handle empty log array', () => {
    expect(detectJsonLogs([])).toBe(false);
  });

  test('should ignore empty lines when calculating ratio', () => {
    const logs = [
      '{"timestamp":"2025-11-18T10:00:00Z","level":"info","message":"Line 1"}',
      '',
      '{"timestamp":"2025-11-18T10:00:01Z","level":"info","message":"Line 2"}',
      '',
      '{"timestamp":"2025-11-18T10:00:02Z","level":"info","message":"Line 3"}',
      '',
      '{"timestamp":"2025-11-18T10:00:03Z","level":"info","message":"Line 4"}',
      '',
      '{"timestamp":"2025-11-18T10:00:04Z","level":"info","message":"Line 5"}',
      '',
      '{"timestamp":"2025-11-18T10:00:05Z","level":"info","message":"Line 6"}',
      '',
      '{"timestamp":"2025-11-18T10:00:06Z","level":"info","message":"Line 7"}',
      '',
      '{"timestamp":"2025-11-18T10:00:07Z","level":"info","message":"Line 8"}',
      '',
    ];

    expect(detectJsonLogs(logs)).toBe(true);
  });

  test('should only check first 20 non-empty lines', () => {
    const logs = [
      '{"timestamp":"2025-11-18T10:00:00Z","level":"info","message":"Line 1"}',
      '{"timestamp":"2025-11-18T10:00:01Z","level":"info","message":"Line 2"}',
      '{"timestamp":"2025-11-18T10:00:02Z","level":"info","message":"Line 3"}',
      '{"timestamp":"2025-11-18T10:00:03Z","level":"info","message":"Line 4"}',
      '{"timestamp":"2025-11-18T10:00:04Z","level":"info","message":"Line 5"}',
      '{"timestamp":"2025-11-18T10:00:05Z","level":"info","message":"Line 6"}',
      '{"timestamp":"2025-11-18T10:00:06Z","level":"info","message":"Line 7"}',
      '{"timestamp":"2025-11-18T10:00:07Z","level":"info","message":"Line 8"}',
      '{"timestamp":"2025-11-18T10:00:08Z","level":"info","message":"Line 9"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 11"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 12"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 13"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 14"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 15"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 16"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 17"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 18"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 19"}',
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 20"}',
      // These lines after the 20th should be ignored
      'Not JSON line 1',
      'Not JSON line 2',
      'Not JSON line 3',
      'Not JSON line 4',
      'Not JSON line 5',
      'Not JSON line 6',
      'Not JSON line 7',
      'Not JSON line 8',
    ];

    expect(detectJsonLogs(logs)).toBe(true);
  });

  test('should detect JSON with nested objects', () => {
    const logs = [
      '{"user":{"id":123,"name":"John"},"action":"login"}',
      '{"user":{"id":124,"name":"Jane"},"action":"logout"}',
      '{"data":{"key":"value","nested":{"deep":"data"}},"timestamp":"2025-11-18"}',
      '{"array":[1,2,3],"object":{"a":"b"}}',
      '{"simple":"test","number":42}',
      '{"bool":true,"null":null}',
      '{"str":"value","num":123}',
      '{"x":1,"y":2}',
      '{"foo":"bar"}',
      '{"last":"one"}',
    ];

    expect(detectJsonLogs(logs)).toBe(true);
  });

  test('should not detect lines with braces but no key-value pairs', () => {
    const logs = [
      'Processing {item}',
      'Found {value} in cache',
      'Error: {error message}',
      'Debug: {info}',
      'Status: {ok}',
      'Result: {success}',
      'Output: {data}',
      'Input: {params}',
      'Config: {settings}',
      'State: {ready}',
    ];

    expect(detectJsonLogs(logs)).toBe(false);
  });

  test.each([
    {
      desc: 'exactly 80% threshold',
      jsonCount: 8,
      nonJsonCount: 2,
      expected: true,
    },
    {
      desc: 'just below 80% threshold',
      jsonCount: 7,
      nonJsonCount: 3,
      expected: false,
    },
  ])('should detect $desc', ({ jsonCount, nonJsonCount, expected }) => {
    const logs = [
      ...Array.from({ length: jsonCount }, (_, i) => `{"valid":"json","line":${i + 1}}`),
      ...Array.from({ length: nonJsonCount }, (_, i) => `Not JSON line ${jsonCount + i + 1}`),
    ];

    expect(detectJsonLogs(logs)).toBe(expected);
  });
});
