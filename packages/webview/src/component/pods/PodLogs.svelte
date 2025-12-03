<script lang="ts">
import type { IDisposable } from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import type { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount, tick } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import { detectJsonLogs } from '/@/component/terminal/json-colorizer';
import {
  ansi256Colours,
  colorizeJSON,
  colorizeLogLevel,
  colourizedANSIContainerName,
} from '/@/component/terminal/terminal-colors';
import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
import { Streams } from '/@/stream/streams';

interface Props {
  object: V1Pod;
}
let { object }: Props = $props();

// Logs has been initialized
let noLogs = $state(true);

const jsonColorizeSampleSize = 20;

// Track if logs are JSON format (auto-detected from first 10 lines)
let isJsonFormat = $state<boolean | undefined>(undefined);
// TODO once we have a toolbar in logs we can add a kebab menu for this setting
let shouldColorizeLogs = $state<boolean>(true);
let logBuffer: string[] = [];

let logsTerminal = $state<Terminal>();

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

// Map that will store the ANSI 256 colour for each container name
// if we run out of colours, we'll start from the beginning.
const prefixColourMap = new SvelteMap<string, string>();

const addLogPrefix = (lines: string[], prefix: string, prefixLength: number): void => {
  if (!prefix || (lines?.length ?? 0) == 0) {
    return;
  }

  const safePadding = Math.max(0, prefixLength - prefix.length);
  const padding = safePadding > 0 ? ' '.repeat(safePadding) : '';
  const mappedPrefix = prefixColourMap.get(prefix) ?? prefix;

  lines.forEach((line, index) => {
    if (index < lines.length - 1 || line.length > 0) {
      lines[index] = `${padding}${mappedPrefix}|${line}`;
    }
  });
};

/**
 * Colorizes and formats log lines with optional container prefix.
 * Applies log level colorization and JSON colorization (if detected).
 *
 * @param data - Raw log data from stream
 * @param prefix - Log line prefix (for multi-container pods)
 * @param maxPrefixLength - Length to normalize prefix with (0 for single container)
 * @returns Formatted and colorized log lines
 */
const colorizeAndFormatLogs = (data: string, prefix?: string, maxPrefixLength: number = 0): string => {
  let lines = data.split('\n');

  if (shouldColorizeLogs) {
    // Auto-detect JSON format from first batch of logs, keep checking until we have at least the sample size line count then we can determine from those
    if (isJsonFormat === undefined || logBuffer.length < jsonColorizeSampleSize) {
      logBuffer.push(...lines.filter(l => l.trim()).slice(0, jsonColorizeSampleSize));
      if (logBuffer.length > 0) {
        isJsonFormat = detectJsonLogs(logBuffer);
        logBuffer = []; // Clear buffer after detection
      }
    }

    // Apply colorization: JSON first, then log levels
    lines =
      (isJsonFormat ?? false)
        ? lines.map(line => colorizeLogLevel(colorizeJSON(line)))
        : lines.map(line => colorizeLogLevel(line));
  }

  // Add container prefix for multi-container pods
  addLogPrefix(lines, prefix ?? '', maxPrefixLength);

  return lines.join('\n');
};

/**
 * Calculates the maximum container name length for padding prefixes in multi-container
 * pods so that log lines align correctly.
 *
 * @returns Max container name length for prefix padding
 */
const calculatePrefixLength = (): number => {
  let maxNameLength = 0;
  object.spec?.containers.forEach(container => {
    if (container.name.length > maxNameLength) {
      maxNameLength = container.name.length;
    }
  });
  return maxNameLength;
};

/**
 * Sets up ANSI color mappings for container name prefixes in multi-container pods.
 * Cycles through available colors using modulo when there are more containers than colors.
 */
const setupPrefixColours = (): void => {
  object.spec?.containers.forEach((container, index) => {
    const colour = ansi256Colours[index % ansi256Colours.length];
    prefixColourMap.set(container.name, colourizedANSIContainerName(container.name, colour));
  });
};

onMount(async () => {
  logsTerminal?.clear();

  let maxNameLength = 0;
  if ((object.spec?.containers.length ?? 0) > 1) {
    maxNameLength = calculatePrefixLength();
    setupPrefixColours();
  }

  for (const containerName of object.spec?.containers.map(c => c.name) ?? []) {
    const logLinePrefix = maxNameLength > 0 ? containerName : undefined;
    disposables.push(
      await streams.streamPodLogs.subscribe(
        object.metadata?.name ?? '',
        object.metadata?.namespace ?? '',
        containerName,
        chunk => {
          const formattedLogs = colorizeAndFormatLogs(chunk.data, logLinePrefix, maxNameLength);
          if (noLogs) {
            noLogs = false;
          }
          logsTerminal?.write(formattedLogs + '\r');
          tick()
            .then(() => {
              window.dispatchEvent(new Event('resize'));
            })
            .catch(console.error);
        },
      ),
    );
  }
});

onDestroy(() => {
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];
});
</script>

<EmptyScreen
  icon={NoLogIcon}
  title="No Log"
  message="Log output of Pod {object.metadata?.name}"
  hidden={noLogs === false} />

<div
  class="min-w-full flex flex-col"
  class:invisible={noLogs === true}
  class:h-0={noLogs === true}
  class:h-full={noLogs === false}>
  <TerminalWindow class="h-full" bind:terminal={logsTerminal} convertEol disableStdIn search />
</div>
