<script lang="ts">
import '@xterm/xterm/css/xterm.css';

import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount } from 'svelte';
import { Remote } from '/@/remote/remote';

import { getTerminalTheme } from './terminal-theme';
import TerminalSearchControls from './TerminalSearchControls.svelte';

interface Props {
  terminal?: Terminal;
  convertEol?: boolean;
  disableStdIn?: boolean;
  screenReaderMode?: boolean;
  showCursor?: boolean;
  search?: boolean;
  class?: string;
  fontSize?: number;
  lineHeight?: number;
  lineCount?: number;
}

let {
  terminal = $bindable(),
  convertEol,
  disableStdIn = true,
  screenReaderMode,
  showCursor = false,
  search = false,
  class: className,
  fontSize = 10,
  lineHeight = 1,
  lineCount = 1000,
}: Props = $props();

let logsXtermDiv: HTMLDivElement | undefined;
let resizeHandler: () => void;
let fitAddon: FitAddon;
let contextMenuHandler: (event: MouseEvent) => void;

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);
let platformName = $state<string>();

async function copySelectionToClipboard(): Promise<boolean> {
  const selection = terminal?.getSelection();
  if (selection) {
    try {
      await systemApi.clipboardWriteText(selection);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }
  return false;
}

async function refreshTerminal(): Promise<void> {
  // missing element, return
  if (!logsXtermDiv) {
    return;
  }

  terminal = new Terminal({
    fontSize,
    lineHeight,
    disableStdin: disableStdIn,
    theme: getTerminalTheme(),
    convertEol: convertEol,
    screenReaderMode: screenReaderMode,
    rightClickSelectsWord: true,
    scrollback: lineCount,
  });
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(logsXtermDiv);
  if (!showCursor) {
    // disable cursor
    terminal.write('\x1b[?25l');
  }

  //copy behavior
  terminal.attachCustomKeyEventHandler((event: KeyboardEvent): boolean => {
    let isCopyShortcut = false;

    if (platformName === 'darwin') {
      // macOS: Cmd+C
      isCopyShortcut = event.metaKey && event.key.toLowerCase() === 'c';
    } else if (platformName === 'linux') {
      // Linux: Ctrl+Shift+C
      isCopyShortcut = event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'C';
    } else {
      // Windows: Ctrl+C
      isCopyShortcut = event.ctrlKey && event.key.toLowerCase() === 'c';
    }

    if (isCopyShortcut) {
      copySelectionToClipboard()
        .then(handled => {
          if (handled) {
            terminal?.clearSelection();
          }
        })
        .catch((err: unknown) => console.error('Failed to copy selection:', err));
      event.preventDefault();
      return false;
    }
    return true;
  });

  contextMenuHandler = (event: MouseEvent): void => {
    copySelectionToClipboard()
      .then(handled => {
        if (handled) {
          terminal?.clearSelection();
        }
      })
      .catch((err: unknown) => console.error('Failed to copy selection:', err));
    event.preventDefault();
  };
  logsXtermDiv.addEventListener('contextmenu', contextMenuHandler);

  // call fit addon each time we resize the window
  resizeHandler = (): void => {
    fitAddon.fit();
  };
  window.addEventListener('resize', resizeHandler);

  fitAddon.fit();
}

$effect(() => {
  if (terminal) {
    if (fontSize) {
      terminal.options.fontSize = fontSize;
      fitAddon?.fit();
    }
    if (lineHeight) {
      terminal.options.lineHeight = lineHeight;
      fitAddon?.fit();
    }
    if (lineCount) {
      terminal.options.scrollback = lineCount;
    }
  }
});

onMount(async () => {
  platformName = await systemApi.getPlatformName();
  await refreshTerminal();
});

onDestroy(() => {
  window.removeEventListener('resize', resizeHandler);
  logsXtermDiv?.removeEventListener('contextmenu', contextMenuHandler);
  terminal?.dispose();
});
</script>

{#if search && terminal}
  <TerminalSearchControls terminal={terminal} />
{/if}

<div
  class="{className} overflow-hidden p-[5px] pr-0 bg-(--pd-terminal-background) h-full w-full"
  role="term"
  bind:this={logsXtermDiv}>
</div>
