/**********************************************************************
 * Copyright (C) 2023 Red Hat, Inc.
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

import type { JsonColorScheme } from './json-colorizer.js';
import { JsonColorizer } from './json-colorizer.js';

// An array of readable ANSI escape sequence colours against a black terminal background
// these are the most "readable" colours against a black background
// No colours like grey, normal blue (cyan instead) or red, since they don't appear very well.
export const ansi256Colours = [
  '\u001b[36m', // cyan
  '\u001b[33m', // yellow
  '\u001b[32m', // green
  '\u001b[35m', // magenta
  '\u001b[34m', // blue
  '\u001b[36;1m', // bright cyan
  '\u001b[33;1m', // bright yellow
  '\u001b[32;1m', // bright green
  '\u001b[35;1m', // bright magenta
  '\u001b[34;1m', // bright blue
];

// ANSI colors for log levels
const LOG_LEVEL_COLORS: Record<string, string> = {
  TRACE: '\u001b[36;1m', // bright cyan
  DBG: '\u001b[32m', // green
  DEBUG: '\u001b[32m',
  INF: '\u001b[36m', // cyan
  INFO: '\u001b[36m',
  INFORMATION: '\u001b[36m',
  WRN: '\u001b[33m', // yellow
  WARN: '\u001b[33m',
  WARNING: '\u001b[33m',
  ERR: '\u001b[31;1m', // bright red
  ERROR: '\u001b[31m;1m',
  FATAL: '\u001b[31m', // bright red
};

// Function that takes the container name and ANSI colour and encapsulates the name in the colour,
// making sure that we reset the colour back to white after the name.
export function colourizedANSIContainerName(name: string, colour: string): string {
  return `${colour}${name}\u001b[0m`;
}

/**
 * Colorizes log levels in brackets for better readability.
 * Detects patterns like [timestamp LEVEL] or [LEVEL] or LEVEL: or (LEVEL) or "LEVEL" anywhere in the line.
 *
 * Examples:
 * - [23:10:06 INF] -> cyan
 * - [DBG] -> green
 * - [ERROR] -> bright red
 * - info: message -> cyan
 * - (INFO) message -> cyan
 * - "WARN" message -> yellow
 * - "information" -> cyan
 * - 2025-10-29T23:10:10.688386132-05:00 info: message -> cyan (with timestamp)
 * - 2025-10-29T23:10:10.688386132-05:00 [23:10:10 INF] -> cyan (with K8s timestamp)
 */
export function colorizeLogLevel(logLine: string): string {
  const levelNames = 'DBG|DEBUG|INF|INFO|INFORMATION|WRN|WARN|WARNING|ERR|ERROR|FATAL|TRACE';
  // Combined pattern: Match [timestamp? LEVEL], LEVEL:, (LEVEL), or "LEVEL" anywhere in the line
  const logLevelPattern = new RegExp(
    `((\\[(?:[0-9:]+\\s+)?)(${levelNames})(\\])|(${levelNames})(:)|(\\()(${levelNames})(\\))|(")(${levelNames})("))`,
    'i',
  );

  const match = logLevelPattern.exec(logLine);
  if (match) {
    const before = logLine.slice(0, match.index);
    const rest = logLine.slice(match.index + match[0].length);

    // Check which format matched
    if (match[2]) {
      // Bracket format: [timestamp? LEVEL]
      const prefix = match[2]; // [timestamp or [
      const level = match[3]; // Keep original case
      const suffix = match[4]; // ]
      const color = LOG_LEVEL_COLORS[level.toUpperCase()] || '\u001b[37m';
      return `${before}${color}${prefix}${level}${suffix}\u001b[0m${rest}`;
    } else if (match[5]) {
      // Colon format: LEVEL:
      const level = match[5]; // Keep original case
      const colon = match[6];
      const color = LOG_LEVEL_COLORS[level.toUpperCase()] || '\u001b[37m';
      return `${before}${color}${level}${colon}\u001b[0m${rest}`;
    } else if (match[7]) {
      // Parenthesis format: (LEVEL)
      const openParen = match[7];
      const level = match[8]; // Keep original case
      const closeParen = match[9];
      const color = LOG_LEVEL_COLORS[level.toUpperCase()] || '\u001b[37m';
      return `${before}${color}${openParen}${level}${closeParen}\u001b[0m${rest}`;
    } else if (match[10]) {
      // Quote format: "LEVEL"
      const openQuote = match[10];
      const level = match[11]; // Keep original case
      const closeQuote = match[12];
      const color = LOG_LEVEL_COLORS[level.toUpperCase()] || '\u001b[37m';
      return `${before}${color}${openQuote}${level}${closeQuote}\u001b[0m${rest}`;
    }
  }

  return logLine;
}

// Create a default JSON colorizer instance
const defaultJsonColorScheme: JsonColorScheme = {
  keyColor: '\u001b[34;1m', // bright blue for keys
  braceColor: '\u001b[33m', // yellow for {}[]
  numberColor: '\u001b[32m', // green for numbers
  booleanColor: '\u001b[35m', // magenta for booleans
  nullColor: '\u001b[35m', // magenta for null
  reset: '\u001b[0m',
};

const defaultJsonColorizer = new JsonColorizer(defaultJsonColorScheme);

/**
 * Colorizes JSON strings for terminal display.
 * Applies ANSI colors to improve readability.
 *
 * Color scheme:
 * - Keys: bright blue
 * - Braces/brackets: yellow
 * - Numbers: green
 * - Booleans/null: magenta
 * - String values: no colorization (optional)
 */
export function colorizeJSON(jsonLine: string): string {
  return defaultJsonColorizer.colorize(jsonLine);
}
