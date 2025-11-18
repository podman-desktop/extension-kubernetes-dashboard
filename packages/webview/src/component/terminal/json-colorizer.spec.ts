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

  test('should colorize braces in yellow', () => {
    const jsonLine = '{"name": "test"}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Strings should not be colorized
    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
  });

  test('should colorize brackets in yellow', () => {
    const jsonLine = '["item1", "item2"]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');
  });

  test('should colorize JSON with number values', () => {
    const jsonLine = '{"count": 42, "price": 19.99}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Numbers should be green
    expect(result).toContain('\u001b[32m42\u001b[0m');
    expect(result).toContain('\u001b[32m19.99\u001b[0m');

    // Keys should not be colorized
    expect(result).toContain('"count"');
    expect(result).toContain('"price"');
  });

  test('should colorize JSON with boolean values', () => {
    const jsonLine = '{"enabled": true, "active": false}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Booleans should be magenta
    expect(result).toContain('\u001b[35mtrue\u001b[0m');
    expect(result).toContain('\u001b[35mfalse\u001b[0m');
  });

  test('should colorize JSON with null values', () => {
    const jsonLine = '{"value": null}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // null should be magenta
    expect(result).toContain('\u001b[35mnull\u001b[0m');
  });

  test('should colorize JSON array with strings', () => {
    const jsonLine = '["item1", "item2", "item3"]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');

    // Strings should not be colorized
    expect(result).toContain('"item1"');
    expect(result).toContain('"item2"');
    expect(result).toContain('"item3"');
  });

  test('should colorize JSON array with numbers', () => {
    const jsonLine = '[1, 2, 3, 4.5]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');

    // Numbers in array should be green
    expect(result).toContain('\u001b[32m1\u001b[0m');
    expect(result).toContain('\u001b[32m2\u001b[0m');
    expect(result).toContain('\u001b[32m3\u001b[0m');
    expect(result).toContain('\u001b[32m4.5\u001b[0m');
  });

  test('should colorize JSON array with booleans', () => {
    const jsonLine = '[true, false, true]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');

    // Booleans in array should be magenta
    expect(result).toContain('\u001b[35mtrue\u001b[0m');
    expect(result).toContain('\u001b[35mfalse\u001b[0m');
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

  test('should colorize JSON with negative numbers', () => {
    const jsonLine = '{"temperature": -15, "balance": -99.99}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Negative numbers should be green
    expect(result).toContain('\u001b[32m-15\u001b[0m');
    expect(result).toContain('\u001b[32m-99.99\u001b[0m');
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

  test('should handle empty JSON object', () => {
    const jsonLine = '{}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');
  });

  test('should handle empty JSON array', () => {
    const jsonLine = '[]';
    const result = colorizer.colorize(jsonLine);

    // Brackets should be yellow
    expect(result).toContain('\u001b[33m[\u001b[0m');
    expect(result).toContain('\u001b[33m]\u001b[0m');
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

  test('should handle zero as a number', () => {
    const jsonLine = '{"value": 0}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Zero should be green
    expect(result).toContain('\u001b[32m0\u001b[0m');
  });

  test('should handle decimal numbers starting with dot', () => {
    const jsonLine = '{"value": 0.5}';
    const result = colorizer.colorize(jsonLine);

    // Braces should be yellow
    expect(result).toContain('\u001b[33m{\u001b[0m');
    expect(result).toContain('\u001b[33m}\u001b[0m');

    // Decimal should be green
    expect(result).toContain('\u001b[32m0.5\u001b[0m');
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

  test('should only check first 10 non-empty lines', () => {
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
      '{"timestamp":"2025-11-18T10:00:09Z","level":"info","message":"Line 10"}',
      // These lines after the 10th should be ignored
      'Not JSON line 11',
      'Not JSON line 12',
      'Not JSON line 13',
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

  test('should detect exactly 80% threshold', () => {
    const logs = [
      '{"valid":"json","line":1}',
      '{"valid":"json","line":2}',
      '{"valid":"json","line":3}',
      '{"valid":"json","line":4}',
      '{"valid":"json","line":5}',
      '{"valid":"json","line":6}',
      '{"valid":"json","line":7}',
      '{"valid":"json","line":8}',
      'Not JSON line 9',
      'Not JSON line 10',
    ];

    // 8 out of 10 = 80%
    expect(detectJsonLogs(logs)).toBe(true);
  });

  test('should not detect just below 80% threshold', () => {
    const logs = [
      '{"valid":"json","line":1}',
      '{"valid":"json","line":2}',
      '{"valid":"json","line":3}',
      '{"valid":"json","line":4}',
      '{"valid":"json","line":5}',
      '{"valid":"json","line":6}',
      '{"valid":"json","line":7}',
      'Not JSON line 8',
      'Not JSON line 9',
      'Not JSON line 10',
    ];

    // 7 out of 10 = 70%
    expect(detectJsonLogs(logs)).toBe(false);
  });
});
