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
import { beforeEach, expect, test, vi } from 'vitest';
import { Remote } from '/@/remote/remote';

import TerminalSearchControls from './TerminalSearchControls.svelte';

vi.mock(import('@xterm/addon-search'));

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

beforeEach(() => {
  vi.resetAllMocks();
  // Reset the mock implementation
  mockSystemApi.getPlatformName.mockResolvedValue('linux');
  mockSystemApi.clipboardWriteText.mockResolvedValue(undefined);
  // Ensure getProxy still returns mockSystemApi after reset
  mockRemote.getProxy.mockReturnValue(mockSystemApi);
});

test('search addon should be loaded to the terminal', async () => {
  render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

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

  unmount();

  await vi.waitFor(() => {
    expect(SearchAddon.prototype.dispose).toHaveBeenCalledOnce();
  });
});

test('input should call findNext on search addon', async () => {
  const user = userEvent.setup();
  const { container } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  // Wait for component to mount
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
  });

  // Trigger Ctrl+F to show search
  await fireEvent.keyUp(container, {
    ctrlKey: true,
    key: 'f',
  });

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
  const { container } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  // Wait for component to mount
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
  });

  // Trigger Ctrl+F to show search
  await fireEvent.keyUp(container, {
    ctrlKey: true,
    key: 'f',
  });

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

test('arrow down should call findNext', async () => {
  const user = userEvent.setup();
  const { container } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  // Wait for component to mount
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
  });

  // Trigger Ctrl+F to show search
  await fireEvent.keyUp(container, {
    ctrlKey: true,
    key: 'f',
  });

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

test('arrow up should call findPrevious', async () => {
  const user = userEvent.setup();
  const { container } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  // Wait for component to mount
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
  });

  // Trigger Ctrl+F to show search
  await fireEvent.keyUp(container, {
    ctrlKey: true,
    key: 'f',
  });

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

test('ctrl+F should focus input', async () => {
  const { container } = render(TerminalSearchControls, {
    props: {
      terminal: TerminalMock,
    },
    context: new Map([[Remote, mockRemote]]),
  });

  // Wait for component to mount
  await vi.waitFor(() => {
    expect(mockSystemApi.getPlatformName).toHaveBeenCalled();
  });

  await fireEvent.keyUp(container, {
    ctrlKey: true,
    key: 'f',
  });

  // Wait for showSearch to become true
  await vi.waitFor(() => {
    const input = container.querySelector('input[aria-label="Find"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });
});
