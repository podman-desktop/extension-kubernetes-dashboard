<script lang="ts">
import '@xterm/xterm/css/xterm.css';

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { onDestroy, onMount } from 'svelte';

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
    if (lineCount) {
      terminal.options.scrollback = lineCount;
    }
  }
});

onMount(async () => {
  await refreshTerminal();
});

onDestroy(() => {
  window.removeEventListener('resize', resizeHandler);
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
