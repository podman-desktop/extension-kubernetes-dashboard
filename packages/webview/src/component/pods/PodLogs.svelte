<script lang="ts">
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import type { IDisposable } from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import type { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount, tick } from 'svelte';
import Fa from 'svelte-fa';
import { SvelteMap } from 'svelte/reactivity';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import { ColorOutputType } from '/@/component/terminal/color-output-types';
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

const jsonColorizeSampleSize = 20;

let noLogs = $state(true);
let colorfulOutputType = $state(undefined);
let jsonDetected = $state(false);
let settingsMenuOpen = $state(false);
let logsTerminal = $state<Terminal>();

let logBuffer: string[] = [];
let disposables: IDisposable[] = [];
let settingsMenuRef: HTMLDivElement | undefined;

const streams = getContext<Streams>(Streams);

// Map that will store the ANSI 256 colour for each container name
// if we run out of colours, we'll start from the beginning.
const prefixColourMap = new SvelteMap<string, string>();

// Trigger resize when logs appear so terminal can recalculate its size
$effect(() => {
  if (!noLogs) {
    triggerResize();
  }
});

function handleSettingChange(): void {
  loadLogs().catch(console.error);
}

const addLogPrefix = (lines: string[], prefix: string, prefixLength: number): void => {
  const safePadding = Math.max(0, prefixLength - prefix.length);
  const padding = safePadding > 0 ? ' '.repeat(safePadding) : '';
  const mappedPrefix = prefixColourMap.get(prefix) ?? prefix;

  lines.forEach((line, index) => {
    if (index < lines.length - 1 || line.length > 0) {
      lines[index] = `${padding}${mappedPrefix}|${line}`;
    }
  });
};

const isJsonDetected = (lines: string[]): boolean => {
  if (logBuffer.length < jsonColorizeSampleSize) {
    logBuffer.push(...lines.filter(l => l.trim()).slice(0, jsonColorizeSampleSize));
    if (logBuffer.length > 0) {
      jsonDetected = detectJsonLogs(logBuffer);
    }
  }
  return jsonDetected;
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
  if (colorfulOutputType === ColorOutputType.NONE || (data?.length ?? 0) === 0) {
    return data;
  }

  let lines: string[] = data.split('\n');
  //format json if the user asked for that or if they didn't set a preference and we auto-detected json logs
  let isJsonFormat = colorfulOutputType === ColorOutputType.FULL || (!colorfulOutputType && isJsonDetected(lines));

  lines = isJsonFormat
    ? lines.map(line => colorizeLogLevel(colorizeJSON(line)))
    : lines.map(line => colorizeLogLevel(line));

  if (prefix) {
    addLogPrefix(lines, prefix, maxPrefixLength);
  }

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

function triggerResize(): void {
  tick()
    .then(() => {
      window.dispatchEvent(new Event('resize'));
    })
    .catch(console.error);
}

async function loadLogs(): Promise<void> {
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];

  logsTerminal?.clear();
  noLogs = true;

  let maxNameLength = 0;
  if ((object.spec?.containers.length ?? 0) > 1) {
    maxNameLength = calculatePrefixLength();
    setupPrefixColours();
  }

  const subscriptionPromises = (object.spec?.containers.map(c => c.name) ?? []).map(async containerName => {
    const logLinePrefix = maxNameLength > 0 ? containerName : undefined;
    return await streams.streamPodLogs.subscribe(
      object.metadata?.name ?? '',
      object.metadata?.namespace ?? '',
      containerName,
      chunk => {
        const formattedLogs = colorizeAndFormatLogs(chunk.data, logLinePrefix, maxNameLength);
        if (formattedLogs.length > 0) {
          logsTerminal?.write(formattedLogs + '\r');
          noLogs = false;
        }
      },
    );
  });

  const results = await Promise.allSettled(subscriptionPromises);
  for (const result of results) {
    if (result.status === 'fulfilled') {
      disposables.push(result.value);
    } else {
      console.error('Failed to subscribe to container logs:', result.reason);
    }
  }
}

onMount(() => {
  loadLogs().catch(console.error);
  const handleClickOutside = (event: MouseEvent): void => {
    if (settingsMenuOpen && settingsMenuRef && !settingsMenuRef.contains(event.target as Node)) {
      settingsMenuOpen = false;
    }
  };
  window.addEventListener('click', handleClickOutside);
  return (): void => {
    window.removeEventListener('click', handleClickOutside);
  };
});

onDestroy(() => {
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];
});
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-4 p-4 bg-(--pd-content-header-bg) border-b border-(--pd-content-divider)">
    <div class="ml-auto flex items-center gap-2">
      <div class="relative" bind:this={settingsMenuRef}>
        <button
          class="p-2 hover:bg-(--pd-content-card-hover-bg) rounded"
          onclick={(): boolean => (settingsMenuOpen = !settingsMenuOpen)}
          name="terminal-settings-button"
          aria-label="Terminal settings">
          <Fa icon={faEllipsisV} />
        </button>
        {#if settingsMenuOpen}
          <div
            class="absolute right-0 mt-1 w-64 bg-(--pd-content-card-bg) border border-(--pd-content-divider) rounded shadow-lg z-10">
            <div class="p-3 space-y-3">
              <label class="flex items-center justify-between gap-2">
                <span class="text-sm">Colourize Logs</span>
                <select
                  bind:value={colorfulOutputType}
                  onchange={handleSettingChange}
                  name="colorful-output"
                  class="bg-(--pd-content-card-bg) border border-(--pd-input-field-stroke) rounded px-2 py-1 text-sm cursor-pointer text-(--pd-content-text)">
                  <option value={undefined} class="bg-(--pd-content-card-bg)">Auto</option>
                  <option value={ColorOutputType.NONE} class="bg-(--pd-content-card-bg)">None</option>
                  <option value={ColorOutputType.BASIC} class="bg-(--pd-content-card-bg)">Basic</option>
                  <option value={ColorOutputType.FULL} class="bg-(--pd-content-card-bg)">Full</option>
                </select>
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if noLogs}
    <EmptyScreen icon={NoLogIcon} title="No Log" message="Log output of Pod {object.metadata?.name}" />
  {/if}

  <div
    class="min-w-full flex flex-col"
    class:invisible={noLogs === true}
    class:h-0={noLogs === true}
    class:flex-1={noLogs === false}>
    <TerminalWindow class="h-full" bind:terminal={logsTerminal} convertEol disableStdIn search />
  </div>
</div>
