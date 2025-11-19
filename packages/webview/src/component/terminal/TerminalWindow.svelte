<style>
.terminal-no-wrap {
  overflow: auto !important;
}

/* Disable xterm's internal scrolling */
.terminal-no-wrap :global(.xterm-viewport) {
  overflow: hidden !important;
  height: auto !important;
}
</style>

<script lang="ts">
import '@xterm/xterm/css/xterm.css';

import { FitAddon } from '@xterm/addon-fit';
import type { IBuffer } from '@xterm/xterm';
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
  wordWrap?: boolean;
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
  wordWrap = true,
}: Props = $props();

let logsXtermDiv: HTMLDivElement | undefined;
let resizeHandler: () => void;
let fitAddon: FitAddon | undefined;
let contentUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

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

  // Always load FitAddon, but use it differently based on wordWrap
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(logsXtermDiv);
  if (!showCursor) {
    // disable cursor
    terminal.write('\x1b[?25l');
  }

  // Listen for content changes to recalculate width when word wrap is off
  terminal.onWriteParsed(() => {
    if (!wordWrap) {
      // Debounce to avoid excessive recalculations
      if (contentUpdateTimeout) {
        clearTimeout(contentUpdateTimeout);
      }
      contentUpdateTimeout = setTimeout(() => {
        applyWordWrapSettings();
      }, 200);
    }
  });

  // Set up resize handler
  resizeHandler = (): void => {
    applyWordWrapSettings();
  };
  window.addEventListener('resize', resizeHandler);

  // Apply initial word wrap settings
  applyWordWrapSettings();
}

function calculateMaxLineLength(buffer: IBuffer): number {
  let maxLength = 0;
  let currentLineLength = 0;

  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i);
    if (!line) continue;

    const contentLength = line.translateToString(true).trimEnd().length;

    if (line.isWrapped) {
      currentLineLength += contentLength;
    } else {
      maxLength = Math.max(maxLength, currentLineLength);
      currentLineLength = contentLength;
    }
  }

  return Math.max(maxLength, currentLineLength);
}

function applyNoWrapSettings(terminal: Terminal, fitAddon: FitAddon): void {
  const dimensions = fitAddon.proposeDimensions();
  if (!dimensions) return;

  const buffer = terminal.buffer.active;
  const maxLength = calculateMaxLineLength(buffer);
  const columns = Math.max(maxLength + 10, dimensions.cols);
  const rows = buffer.length;

  terminal.resize(columns, rows);
}

function applyWordWrapSettings(): void {
  if (!terminal || !fitAddon) {
    return;
  }

  if (wordWrap) {
    fitAddon.fit();
  } else {
    applyNoWrapSettings(terminal, fitAddon);
  }
}

$effect(() => {
  if (!terminal) {
    return;
  }

  let tryFit = false;
  if (fontSize) {
    terminal.options.fontSize = fontSize;
    tryFit = true;
  }
  if (lineHeight) {
    terminal.options.lineHeight = lineHeight;
    tryFit = true;
  }
  if (lineCount) {
    terminal.options.scrollback = lineCount;
  }

  // Apply word wrap settings whenever relevant properties change
  if (tryFit) {
    applyWordWrapSettings();
  }
});

onMount(async () => {
  await refreshTerminal();
});

onDestroy(() => {
  if (contentUpdateTimeout) {
    clearTimeout(contentUpdateTimeout);
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  terminal?.dispose();
});
</script>

{#if search && terminal}
  <TerminalSearchControls terminal={terminal} />
{/if}

<div
  class="{className} h-full bg-(--pd-terminal-background) p-[5px]"
  class:pr-0={wordWrap}
  class:overflow-hidden={wordWrap}
  class:terminal-no-wrap={!wordWrap}
  role="term"
  bind:this={logsXtermDiv}>
</div>
