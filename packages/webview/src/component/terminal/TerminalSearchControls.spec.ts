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

import { fireEvent, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { SearchAddon } from '@xterm/addon-search';
import type { Terminal } from '@xterm/xterm';
import { tick } from 'svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Remote } from '/@/remote/remote';

import TerminalSearchControls from './TerminalSearchControls.svelte';

vi.mock(import('@xterm/addon-search'));

// Store the window's keydown handler for testing
let windowKeyDownHandler: ((event: KeyboardEvent) => void) | undefined;

const TerminalMock: Terminal = {
  onWriteParsed: vi.fn(),
  onResize: vi.fn(),
  dispose: vi.fn(),
  attachCustomKeyEventHandler: vi.fn(),
} as unknown as Terminal;

// Mock the Remote context
const mockSystemApi = {
  getPlatformName: vi.fn(),
  clipboardWriteText: vi.fn(),
};

const mockRemote = {
  getProxy: vi.fn().mockReturnValue(mockSystemApi),
};

// Mock window.addEventListener to capture the handler
const originalAddEventListener = window.addEventListener.bind(window);
const originalRemoveEventListener = window.removeEventListener.bind(window);

let unmountFn: (() => void) | undefined;

beforeEach(() => {
  vi.resetAllMocks();
  windowKeyDownHandler = undefined;

  // Reset the mock implementation
  mockSystemApi.getPlatformName.mockResolvedValue('linux');
  mockSystemApi.clipboardWriteText.mockResolvedValue(undefined);
  // Ensure getProxy still returns mockSystemApi after reset
  mockRemote.getProxy.mockReturnValue(mockSystemApi);

  // Capture window event listener
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'keydown') {
      windowKeyDownHandler = listener as (event: KeyboardEvent) => void;
    }
    return originalAddEventListener(type, listener, options);
  });

  vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener, options) => {
    if (type === 'keydown') {
      windowKeyDownHandler = undefined;
    }
    return originalRemoveEventListener(type, listener, options);
  });
});

afterEach(() => {
  // Clean up component to remove window event listeners
  unmountFn?.();
  unmountFn = undefined;
  vi.restoreAllMocks();
});

// Helper to create a mock KeyboardEvent
function createKeyboardEvent(key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

// Helper to trigger search open via the captured window handler
async function openSearchViaKeyboard(): Promise<void> {
  if (windowKeyDownHandler) {
    const event = createKeyboardEvent('f', { ctrlKey: true });
    windowKeyDownHandler(event);
    await tick();
  }
}

// Helper to trigger search close via Escape
async function closeSearchViaEscape(): Promise<void> {
  if (windowKeyDownHandler) {
    const event = createKeyboardEvent('Escape');
    windowKeyDownHandler(event);
    await tick();
  }
}

test('search addon should be loaded to the terminal', async () => {
  const { unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.activate).toHaveBeenCalledOnce();
    expect(SearchAddon.prototype.activate).toHaveBeenCalledWith(TerminalMock);
  });
});

test('search addon should be disposed on component destroy', async () => {
  const { unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.activate).toHaveBeenCalled();
  });

  unmount();

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.dispose).toHaveBeenCalledOnce();
  });
});

test('input should call findNext on search addon', async () => {
  const user = userEvent.setup();
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Trigger Ctrl+F to show search
  await openSearchViaKeyboard();

  // Wait for search to be visible
  await vi.waitFor(() => {
    const searchTextbox = container.querySelector('input[aria-label="Find"]');
    expect(searchTextbox).toBeInTheDocument();
  });

  const searchTextbox = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
  await user.type(searchTextbox, 'hello');

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.findNext).toHaveBeenCalledWith('hello', {
      incremental: true,
    });
  });
});

test('key Enter should call findNext with incremental', async () => {
  const user = userEvent.setup();
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Trigger Ctrl+F to show search
  await openSearchViaKeyboard();

  // Wait for search to be visible
  await vi.waitFor(() => {
    const searchTextbox = container.querySelector('input[aria-label="Find"]');
    expect(searchTextbox).toBeInTheDocument();
  });

  const searchTextbox = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
  await user.type(searchTextbox, 'hello{Enter}');

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.findNext).toHaveBeenCalledWith('hello', {
      incremental: true,
    });
  });
});

test('next match button should call findNext', async () => {
  const user = userEvent.setup();
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Trigger Ctrl+F to show search
  await openSearchViaKeyboard();

  // Wait for search to be visible and enter search term
  const searchInput = await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    return input;
  });

  // Type search term
  await user.type(searchInput, 'test');

  // Find and click the next button
  const nextBtn = container.querySelector('button[aria-label="Next Match"]') as HTMLButtonElement;
  await fireEvent.click(nextBtn);

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.findNext).toHaveBeenCalledWith('test', {
      incremental: true,
    });
  });
});

test('previous match button should call findPrevious', async () => {
  const user = userEvent.setup();
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Trigger Ctrl+F to show search
  await openSearchViaKeyboard();

  // Wait for search to be visible and enter search term
  const searchInput = await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    return input;
  });

  // Type search term
  await user.type(searchInput, 'test');

  // Find and click the previous button
  const prevBtn = container.querySelector('button[aria-label="Previous Match"]') as HTMLButtonElement;
  await fireEvent.click(prevBtn);

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.findPrevious).toHaveBeenCalledWith('test', {
      incremental: true,
    });
  });
});

test('ctrl+F should show search and focus input', async () => {
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  await openSearchViaKeyboard();

  // Wait for showSearch to become true
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });
});

test('escape should close search when open', async () => {
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Open search
  await openSearchViaKeyboard();

  // Wait for search to be visible
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]');
    expect(input).toBeInTheDocument();
  });

  // Close search with Escape
  await closeSearchViaEscape();

  // Wait for search to be hidden
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]');
    expect(input).not.toBeInTheDocument();
  });
});

test('close button should close search', async () => {
  const { container, unmount } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });
  unmountFn = unmount;

  // Wait for component to mount and window handler to be set
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
    expect(windowKeyDownHandler).toBeDefined();
  });

  // Open search
  await openSearchViaKeyboard();

  // Wait for search to be visible
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]');
    expect(input).toBeInTheDocument();
  });

  // Click close button
  const closeBtn = container.querySelector('button[aria-label="Close Search"]') as HTMLButtonElement;
  await fireEvent.click(closeBtn);

  // Wait for search to be hidden
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]');
    expect(input).not.toBeInTheDocument();
  });
});
