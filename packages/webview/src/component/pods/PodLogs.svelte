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

// Track if logs are JSON format (auto-detected from first 10 lines)
let isJsonFormat = $state<boolean | undefined>(undefined);
// TODO once we have a toolbar in logs we can add a kebab menu for this setting
let shouldColorizeLogs = $state<boolean>(true);
let logBuffer: string[] = [];

let logsTerminal = $state<Terminal>();

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

// Create a map that will store the ANSI 256 colour for each container name
// if we run out of colours, we'll start from the beginning.
const colourizedContainerName = new SvelteMap<string, string>();

/**
 * Colorizes and formats log lines with optional container prefix.
 * Applies log level colorization and JSON colorization (if detected).
 *
 * @param data - Raw log data from stream
 * @param containerName - Name of the container (for multi-container pods)
 * @param maxNameLength - Maximum container name length for padding (0 for single container)
 * @returns Formatted and colorized log lines
 */
const colorizeAndFormatLogs = (data: string, containerName?: string, maxNameLength: number = 0): string => {
  let lines = data.split('\n');

  if (shouldColorizeLogs) {
    // Auto-detect JSON format from first batch of logs
    if (isJsonFormat === undefined) {
      logBuffer.push(...lines.filter(l => l.trim()));
      if (logBuffer.length >= 10) {
        isJsonFormat = detectJsonLogs(logBuffer);
        logBuffer = []; // Clear buffer after detection
      }
    }

    // Apply colorization: JSON first (if detected/only a few lines of logs), then log levels
    lines =
      (isJsonFormat ?? true)
        ? lines.map(line => colorizeLogLevel(colorizeJSON(line)))
        : lines.map(line => colorizeLogLevel(line));
  }

  // Add container prefix for multi-container pods
  if (containerName && maxNameLength > 0) {
    const padding = ' '.repeat(maxNameLength - containerName.length);
    const colouredName = colourizedContainerName.get(containerName);
    // All lines are prefixed, except the last one if it's empty
    return lines
      .map((line, index, arr) =>
        index < arr.length - 1 || line.length > 0 ? `${padding}${colouredName}|${line}` : line,
      )
      .join('\n');
  }

  return lines.join('\n');
};

onMount(async () => {
  logsTerminal?.clear();

  const containerCount = object.spec?.containers.length ?? 0;

  // Go through each name of pod.containers array and determine
  // how much spacing is required for each name to be printed.
  let maxNameLength = 0;
  if (containerCount > 1) {
    object.spec?.containers.forEach((container, index) => {
      if (container.name.length > maxNameLength) {
        maxNameLength = container.name.length;
      }
      const colour = ansi256Colours[index % ansi256Colours.length];
      colourizedContainerName.set(container.name, colourizedANSIContainerName(container.name, colour));
    });
  }

  const processLogData = (containerName: string, data: string, callback: (data: string) => void): void => {
    const formattedLogs = colorizeAndFormatLogs(
      data,
      containerCount > 1 ? containerName : undefined,
      containerCount > 1 ? maxNameLength : 0,
    );
    callback(formattedLogs);
  };

  for (const containerName of object.spec?.containers.map(c => c.name) ?? []) {
    disposables.push(
      await streams.streamPodLogs.subscribe(
        object.metadata?.name ?? '',
        object.metadata?.namespace ?? '',
        containerName,
        chunk => {
          processLogData(containerName, chunk.data, data => {
            if (noLogs) {
              noLogs = false;
            }
            logsTerminal?.write(data + '\r');
            tick()
              .then(() => {
                window.dispatchEvent(new Event('resize'));
              })
              .catch(console.error);
          });
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
  <TerminalWindow class="h-full" bind:terminal={logsTerminal} convertEol disableStdIn />
</div>
