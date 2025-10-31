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
    DBG: '\u001b[36m', // cyan
    DEBUG: '\u001b[36m',
    INF: '\u001b[32m', // green
    INFO: '\u001b[32m',
    WRN: '\u001b[33m', // yellow
    WARN: '\u001b[33m',
    WARNING: '\u001b[33m',
    ERR: '\u001b[31m', // red
    ERROR: '\u001b[31m',
    FATAL: '\u001b[31;1m', // bright red
    TRACE: '\u001b[35m', // magenta
};

// Function that takes the container name and ANSI colour and encapsulates the name in the colour,
// making sure that we reset the colour back to white after the name.
export function colourizedANSIContainerName(name: string, colour: string): string {
  return `${colour}${name}\u001b[0m`;
}

/**
 * Colorizes log levels in brackets for better readability.
 * Detects patterns like [timestamp LEVEL] or [LEVEL] anywhere in the line.
 * 
 * Examples:
 * - [23:10:06 INF] -> green
 * - [DBG] -> cyan
 * - [ERROR] -> red
 * - 2025-10-29T23:10:10.688386132-05:00 [23:10:10 INF] -> green (with K8s timestamp)
 */
export function colorizeLogLevel(logLine: string): string {
    // Pattern to match [timestamp? LEVEL] anywhere in the line (removed ^ anchor)
    const logLevelPattern = /(\[(?:[0-9:]+\s+)?)(DBG|DEBUG|INF|INFO|WRN|WARN|WARNING|ERR|ERROR|FATAL|TRACE)(\])/i;

    const match = logLine.match(logLevelPattern);
    if (match && match.index !== undefined) {
        const beforeBracket = logLine.slice(0, match.index);
        const prefix = match[1]; // [timestamp or [
        const level = match[2].toUpperCase();
        const suffix = match[3]; // ]
        const rest = logLine.slice(match.index + match[0].length);

        const color = LOG_LEVEL_COLORS[level] || '\u001b[37m';
        return `${beforeBracket}${color}${prefix}${level}${suffix}\u001b[0m${rest}`;
    }

    return logLine;
}
