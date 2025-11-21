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

import { colorizeLogLevel } from './terminal-colors.js';

describe('colorizeLogLevel', () => {
  test('should colorize INFO log level in cyan', () => {
    const logLine = '[23:10:06 INF] Starting application';
    const result = colorizeLogLevel(logLine);

    // Should contain cyan ANSI code for INFO
    expect(result).toContain('\u001b[36m');
    // Should contain reset code
    expect(result).toContain('\u001b[0m');
    // Should preserve the rest of the message
    expect(result).toContain('Starting application');
  });

  test('should colorize DEBUG log level in cyan', () => {
    const logLine = '[DBG] Debug message';
    const result = colorizeLogLevel(logLine);

    // Should contain green ANSI code for DEBUG
    expect(result).toContain('\u001b[32m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('Debug message');
  });

  test('should colorize ERROR log level in red', () => {
    const logLine = '[ERROR] Something went wrong';
    const result = colorizeLogLevel(logLine);

    // Should contain bright red ANSI code for ERROR
    expect(result).toContain('\u001b[31'); // Match both \u001b[31m and \u001b[31;1m
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('Something went wrong');
  });

  test('should colorize WARN log level in yellow', () => {
    const logLine = '[12:34:56 WARN] Warning message';
    const result = colorizeLogLevel(logLine);

    // Should contain yellow ANSI code for WARN
    expect(result).toContain('\u001b[33m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('Warning message');
  });

  test('should colorize FATAL log level in bright red', () => {
    const logLine = '[FATAL] Critical error';
    const result = colorizeLogLevel(logLine);

    // Should contain red ANSI code for FATAL
    expect(result).toContain('\u001b[31m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('Critical error');
  });

  test('should colorize TRACE log level in magenta', () => {
    const logLine = '[TRACE] Trace information';
    const result = colorizeLogLevel(logLine);

    // Should contain bright cyan ANSI code for TRACE
    expect(result).toContain('\u001b[36;1m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('Trace information');
  });

  test('should handle log line with Kubernetes timestamp prefix', () => {
    const logLine = '2025-10-29T23:10:10.688386132-05:00 [23:10:10 INF] Server started';
    const result = colorizeLogLevel(logLine);

    // Should preserve the K8s timestamp
    expect(result).toContain('2025-10-29T23:10:10.688386132-05:00');
    // Should colorize the INFO level
    expect(result).toContain('\u001b[36m');
    expect(result).toContain('Server started');
  });

  test('should handle case-insensitive log levels', () => {
    const logLine1 = '[info] lowercase info';
    const result1 = colorizeLogLevel(logLine1);
    expect(result1).toContain('\u001b[36m');

    const logLine2 = '[Info] Mixed case info';
    const result2 = colorizeLogLevel(logLine2);
    expect(result2).toContain('\u001b[36m');
  });

  test('should handle abbreviated log levels', () => {
    const testCases = [
      { input: '[INF] Info message', color: '\u001b[36m' },
      { input: '[WRN] Warning message', color: '\u001b[33m' },
      { input: '[ERR] Error message', color: '\u001b[31' }, // Match both formats
    ];

    testCases.forEach(({ input, color }) => {
      const result = colorizeLogLevel(input);
      expect(result).toContain(color);
    });
  });

  test('should handle log level in middle of line', () => {
    const logLine = 'prefix content [23:10:06 INFO] message after bracket';
    const result = colorizeLogLevel(logLine);

    // Should preserve prefix
    expect(result).toContain('prefix content');
    // Should colorize INFO
    expect(result).toContain('\u001b[36m');
    // Should preserve suffix
    expect(result).toContain('message after bracket');
  });

  test('should not modify line without log level', () => {
    const logLine = 'This is a regular log line without level';
    const result = colorizeLogLevel(logLine);

    // Should return the line unchanged
    expect(result).toBe(logLine);
  });

  test('should not modify line with text in brackets that is not a log level', () => {
    const logLine = '[NOTLEVEL] This is not a log level';
    const result = colorizeLogLevel(logLine);

    // Should return the line unchanged
    expect(result).toBe(logLine);
  });

  test('should handle full word log levels', () => {
    const testCases = [
      { input: '[DEBUG] Debug message', color: '\u001b[32m' },
      { input: '[INFO] Info message', color: '\u001b[36m' },
      { input: '[WARNING] Warning message', color: '\u001b[33m' },
      { input: '[ERROR] Error message', color: '\u001b[31' }, // Match both formats
    ];

    testCases.forEach(({ input, color }) => {
      const result = colorizeLogLevel(input);
      expect(result).toContain(color);
    });
  });

  test('should only colorize the first log level found', () => {
    const logLine = '[INFO] Found another [ERROR] in message';
    const result = colorizeLogLevel(logLine);

    // Should colorize INFO (first match)
    expect(result).toContain('\u001b[36m');
    // Count how many times we see the reset code - should only be once
    // eslint-disable-next-line sonarjs/no-control-regex, no-control-regex
    const resetCount = (result.match(/\u001b\[0m/g) ?? []).length;
    expect(resetCount).toBe(1);
  });

  test('should preserve exact format of brackets and timestamp', () => {
    const logLine = '[23:10:06 INFO] Message';
    const result = colorizeLogLevel(logLine);

    // The timestamp and brackets should still be present
    expect(result).toMatch(/23:10:06/);
    expect(result).toMatch(/INFO/);
  });

  test('should colorize colon format log level', () => {
    const logLine = 'info: mylog';
    const result = colorizeLogLevel(logLine);

    // Should contain cyan ANSI code for info
    expect(result).toContain('\u001b[36m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('mylog');
  });

  test('should colorize JSON format with quoted level', () => {
    const logLine = '{"timestamp":"123","level":"information","message":"test"}';
    const result = colorizeLogLevel(logLine);

    // Should contain cyan ANSI code for information
    expect(result).toContain('\u001b[36m');
    expect(result).toContain('\u001b[0m');
    expect(result).toContain('"information"');
  });
});
