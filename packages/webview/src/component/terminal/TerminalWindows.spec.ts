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

import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/svelte';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TerminalWindow from './TerminalWindow.svelte';

vi.mock(import('@xterm/xterm'));

vi.mock(import('@xterm/addon-fit'));

vi.mock(import('@xterm/addon-search'));

let mockTerminalInstance: Partial<Terminal>;

beforeEach(() => {
  vi.resetAllMocks();

  // Create a mock terminal instance with spies
  const writeSpy = vi.fn();
  const loadAddonSpy = vi.fn();

  mockTerminalInstance = {
    options: {},
    dispose: vi.fn(),
    loadAddon: loadAddonSpy,
    write: writeSpy,
    open: vi.fn(),
  };

  // Mock the Terminal constructor to return the mock instance
  vi.mocked(Terminal).mockImplementation(() => mockTerminalInstance as Terminal);

  // Also set up prototype mocks for tests that check Terminal.prototype
  Terminal.prototype.write = writeSpy;
  Terminal.prototype.loadAddon = loadAddonSpy;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createTerminalMock(): Terminal {
  return {
    ...writable(),
    options: {},
    dispose: vi.fn(),
    loadAddon: vi.fn(),
    write: vi.fn(),
    open: vi.fn(),
  } as unknown as Terminal;
}

test('expect terminal constructor to have been called on mount', async () => {
  render(TerminalWindow, {
    terminal: createTerminalMock(),
  });

  await vi.waitFor(() => {
    expect(Terminal).toHaveBeenCalledOnce();
  });
});

test('expect terminal constructor to reflect props', async () => {
  render(TerminalWindow, {
    terminal: createTerminalMock(),
    disableStdIn: true,
    convertEol: true,
    screenReaderMode: true,
  });

  await vi.waitFor(() => {
    expect(Terminal).toHaveBeenCalledWith(
      expect.objectContaining({
        disableStdin: true,
        convertEol: true,
        screenReaderMode: true,
      }),
    );
  });
});

test('showCursor false or undefined should write specific instruction to terminal', async () => {
  render(TerminalWindow, {
    terminal: createTerminalMock(),
    showCursor: false,
  });

  await vi.waitFor(() => {
    expect(Terminal).toHaveBeenCalledOnce();
  });
  expect(Terminal.prototype.write).toHaveBeenCalledWith('\x1b[?25l');
});

test('addon fit should be loaded on mount', async () => {
  const fitAddonMock = {
    fit: vi.fn(),
  } as unknown as FitAddon;

  vi.mocked(FitAddon).mockReturnValue(fitAddonMock);

  render(TerminalWindow, {
    terminal: createTerminalMock(),
  });

  await vi.waitFor(() => {
    expect(Terminal).toHaveBeenCalled();
  });

  expect(FitAddon).toHaveBeenCalled();
  expect(Terminal.prototype.loadAddon).toHaveBeenCalledWith(fitAddonMock);
});

test('matchMedia resize listener should trigger fit addon', async () => {
  // spy the event listener
  vi.spyOn(window, 'addEventListener');

  render(TerminalWindow, {
    terminal: createTerminalMock(),
  });

  const listener: () => void = await vi.waitFor(() => {
    expect(window.addEventListener).toHaveBeenCalled();
    const call = vi.mocked(window.addEventListener).mock.calls;
    expect(call).toHaveLength(1);
    expect(call[0][0]).toBe('resize');
    expect(call[0][1]).toBeInstanceOf(Function);
    return call[0][1] as unknown as () => void;
  });

  // reset fit calls count
  vi.mocked(FitAddon.prototype.fit).mockReset();
  expect(FitAddon.prototype.fit).not.toHaveBeenCalled();

  listener();

  expect(FitAddon.prototype.fit).toHaveBeenCalled();
});

test('search props should add terminal search controls', async () => {
  const { getByRole } = render(TerminalWindow, {
    terminal: createTerminalMock(),
    search: true,
  });

  const searchTextbox = getByRole('textbox', {
    name: 'Find',
  });

  expect(searchTextbox).toBeInTheDocument();
});
