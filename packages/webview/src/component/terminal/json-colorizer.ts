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

export interface JsonColorScheme {
  keyColor?: string; // Color for object keys (optional)
  stringColor?: string; // Color for string values (optional)
  braceColor?: string; // Color for braces/brackets (optional)
  numberColor?: string; // Color for numbers (optional)
  booleanColor?: string; // Color for booleans (optional)
  nullColor?: string; // Color for null (optional)
  reset: string; // Reset code (required)
}

interface ProcessResult {
  text: string;
  nextIndex: number;
}

/**
 * A class for colorizing JSON strings with ANSI escape codes.
 * Supports customizable color schemes for keys, values, numbers, booleans, and null.
 */
export class JsonColorizer {
  constructor(private readonly colorScheme: JsonColorScheme) {}

  /**
   * Colorizes a JSON string with ANSI color codes.
   * Processes the string character by character to avoid escape code conflicts.
   *
   * @param jsonLine - The JSON string to colorize
   * @returns The colorized JSON string with ANSI codes
   */
  colorize(jsonLine: string): string {
    let result = '';
    let i = 0;
    let isAfterColon = false;

    while (i < jsonLine.length) {
      const char = jsonLine[i];

      // Handle structural characters
      const structuralResult = this.handleStructuralChar(char, isAfterColon);
      if (structuralResult !== undefined) {
        result += structuralResult.text;
        isAfterColon = structuralResult.isAfterColon;
        i++;
        continue;
      }

      // Handle quoted strings (keys or values)
      if (char === '"') {
        const stringResult = this.processString(jsonLine, i, isAfterColon);
        result += stringResult.text;
        i = stringResult.nextIndex;
        continue;
      }

      // Handle numbers
      if (this.isNumberStart(jsonLine, i)) {
        const numberResult = this.processNumber(jsonLine, i);
        result += numberResult.text;
        i = numberResult.nextIndex;
        continue;
      }

      // Handle keywords (boolean/null)
      const keywordResult = this.processKeyword(jsonLine, i);
      if (keywordResult) {
        result += keywordResult.text;
        i = keywordResult.nextIndex;
        continue;
      }

      // Regular character
      result += char;
      i++;
    }

    return result;
  }

  private handleStructuralChar(
    char: string,
    _isAfterColon: boolean,
  ): { text: string; isAfterColon: boolean } | undefined {
    // Handle braces and brackets
    if (char === '{' || char === '}' || char === '[' || char === ']') {
      const text = this.colorScheme.braceColor ? this.colorScheme.braceColor + char + this.colorScheme.reset : char;
      return { text, isAfterColon: false };
    }

    // Track colon to distinguish keys from values
    if (char === ':') {
      return { text: char, isAfterColon: true };
    }

    // Track comma to reset key/value state
    if (char === ',') {
      return { text: char, isAfterColon: false };
    }

    return undefined;
  }

  private processString(jsonLine: string, startIndex: number, isAfterColon: boolean): ProcessResult {
    const stringEnd = this.findStringEnd(jsonLine, startIndex);
    const stringContent = jsonLine.substring(startIndex, stringEnd);

    // Determine if this is a key (before colon) or value (after colon)
    const isKey = !isAfterColon;
    const colorToUse = isKey ? this.colorScheme.keyColor : this.colorScheme.stringColor;

    const text = colorToUse ? colorToUse + stringContent + this.colorScheme.reset : stringContent;

    return {
      text,
      nextIndex: stringEnd,
    };
  }

  private findStringEnd(jsonLine: string, startIndex: number): number {
    let i = startIndex + 1; // Skip opening quote

    // Find closing quote (handle escaped quotes)
    while (i < jsonLine.length && (jsonLine[i] !== '"' || jsonLine[i - 1] === '\\')) {
      i++;
    }
    i++; // Include closing quote

    return i;
  }

  private isNumberStart(jsonLine: string, index: number): boolean {
    const char = jsonLine[index];
    const isDigitOrMinus = /[\d-]/.test(char);
    if (!isDigitOrMinus) return false;

    // Check if we're in a number context
    for (let k = index - 1; k >= 0; k--) {
      const prevChar = jsonLine[k];
      if (/\s/.test(prevChar)) continue;
      return prevChar === ':' || prevChar === '[' || prevChar === ',';
    }
    return false;
  }

  private processNumber(jsonLine: string, startIndex: number): ProcessResult {
    let i = startIndex;
    if (jsonLine[i] === '-') i++;

    while (i < jsonLine.length && /[\d.]/.test(jsonLine[i])) {
      i++;
    }

    const number = jsonLine.substring(startIndex, i);
    const text = this.colorScheme.numberColor ? this.colorScheme.numberColor + number + this.colorScheme.reset : number;
    return {
      text,
      nextIndex: i,
    };
  }

  private processKeyword(jsonLine: string, startIndex: number): ProcessResult | undefined {
    // Handle boolean values
    if (jsonLine.substring(startIndex, startIndex + 4) === 'true') {
      const text = this.colorScheme.booleanColor
        ? this.colorScheme.booleanColor + 'true' + this.colorScheme.reset
        : 'true';
      return {
        text,
        nextIndex: startIndex + 4,
      };
    }

    if (jsonLine.substring(startIndex, startIndex + 5) === 'false') {
      const text = this.colorScheme.booleanColor
        ? this.colorScheme.booleanColor + 'false' + this.colorScheme.reset
        : 'false';
      return {
        text,
        nextIndex: startIndex + 5,
      };
    }

    // Handle null
    if (jsonLine.substring(startIndex, startIndex + 4) === 'null') {
      const text = this.colorScheme.nullColor ? this.colorScheme.nullColor + 'null' + this.colorScheme.reset : 'null';
      return {
        text,
        nextIndex: startIndex + 4,
      };
    }

    return undefined;
  }
}

/**
 * Checks if a string appears to be valid JSON.
 * A valid JSON line should have both { and } and contain at least one key-value pair pattern.
 *
 * @param line - The line to check
 * @returns true if the line appears to be JSON
 */
export function isValidJSON(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Find positions of braces
  const openBrace = trimmed.indexOf('{');
  const closeBrace = trimmed.lastIndexOf('}');

  // Must have both braces and { must come before }
  if (openBrace === -1 || closeBrace === -1 || openBrace >= closeBrace) return false;

  // Extract content between braces and check for key-value pair pattern
  const contentBetweenBraces = trimmed.substring(openBrace + 1, closeBrace);

  // Look for key-value pair pattern: "key": value or "key":value
  const kvpPattern = /"[^"]+"\s*:\s*[^,}]+/;
  return kvpPattern.test(contentBetweenBraces);
}

/**
 * Detects if log lines are predominantly JSON format.
 *
 * @param lines - Array of log lines to analyze
 * @returns true if logs should be treated as JSON format
 */
export function detectJsonLogs(lines: string[]): boolean {
  const threshold = 0.8; // 80%

  // Filter out empty lines
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);

  // Need at least a few lines to make a determination
  if (nonEmptyLines.length === 0) return false;

  const jsonCount = nonEmptyLines.filter(line => isValidJSON(line)).length;
  const jsonRatio = jsonCount / nonEmptyLines.length;

  return jsonRatio >= threshold;
}
