<script lang="ts">
import { faCircleInfo, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import type { IDisposable, PodLogsOptions } from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { Button, EmptyScreen, Tooltip } from '@podman-desktop/ui-svelte';
import type { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount } from 'svelte';
import Fa from 'svelte-fa';
import { SvelteMap } from 'svelte/reactivity';
import type { Unsubscriber } from 'svelte/store';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import { ansi256Colours, colorizeLogLevel, colourizedANSIContainerName } from '/@/component/terminal/terminal-colors';
import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
import { States } from '/@/state/states';
import { Streams } from '/@/stream/streams';

interface Props {
  object: V1Pod;
}
let { object }: Props = $props();

const states = getContext<States>(States);
const terminalSettingsState = states.stateTerminalSettingsInfoUI;

// Logs has been initialized
let noLogs = $state(true);

let logsTerminal = $state<Terminal>();

const lineCount = $derived(terminalSettingsState.data?.scrollback ?? 1000);
const colorfulOutputCacheKey = 'podlogs.terminal.colorful-output';

// Log retrieval mode and options
let isStreaming = $state(true);
let previous = $state(false);
let tailLines = $state<number | undefined>(lineCount);
let sinceSeconds = $state<number | undefined>(undefined);
let timestamps = $state(false);
let colorfulOutput = $state(localStorage.getItem(colorfulOutputCacheKey) !== 'false'); // Default to true
let fontSize = $state(terminalSettingsState.data?.fontSize ?? 10);
let lineHeight = $state(terminalSettingsState.data?.lineHeight ?? 1);
let settingsMenuOpen = $state(false);

// Track loaded values to detect changes
let loadedTailLines = $state<number | undefined>(lineCount);
let loadedSinceSeconds = $state<number | undefined>(undefined);

// Detect if tail/seconds have changed from loaded values
const hasUnsyncedChanges = $derived(tailLines !== loadedTailLines || sinceSeconds !== loadedSinceSeconds);

// Save colorfulOutput to localStorage whenever it changes
$effect(() => {
  localStorage.setItem(colorfulOutputCacheKey, String(colorfulOutput));
});

// Update fontSize when terminal settings change
$effect(() => {
  const data = terminalSettingsState.data;
  if (!data) {
    return;
  }
  if (data.fontSize !== undefined) {
    fontSize = data.fontSize;
  }
  if (data.lineHeight !== undefined) {
    lineHeight = data.lineHeight;
  }
  if (data.scrollback !== undefined && tailLines === lineCount) {
    //only update tailLines if the user didn't override it
    tailLines = data.scrollback;
  }
});

// Handler for settings that should trigger immediate reload
function handleSettingChange(): void {
  loadLogs().catch(console.error);
}

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

// Create a map that will store the ANSI 256 colour for each container name
// if we run out of colours, we'll start from the beginning.
const colourizedContainerName = new SvelteMap<string, string>();

// Debounced resize handler, this will speed up initial log loading
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
function triggerResize(): void {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
}

async function loadLogs(): Promise<void> {
  // First, dispose of old subscriptions to stop any incoming data
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];

  // Now clear the terminal
  logsTerminal?.clear();
  noLogs = true;

  // Update loaded values to current settings
  loadedTailLines = tailLines;
  loadedSinceSeconds = sinceSeconds;

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

  const multiContainers =
    containerCount > 1
      ? (name: string, data: string, callback: (data: string) => void): void => {
          const padding = ' '.repeat(maxNameLength - name.length);
          const colouredName = colourizedContainerName.get(name);

          // All lines are prefixed, except the last one if it's empty.
          const lines = data
            .split('\n')
            .map(line => (colorfulOutput ? colorizeLogLevel(line) : line)) //todo when JSONColorize gets merged this will change
            .map((line, index, arr) =>
              index < arr.length - 1 || line.length > 0 ? `${padding}${colouredName}|${line}` : line,
            );
          callback(lines.join('\n'));
        }
      : (_name: string, data: string, callback: (data: string) => void): void => {
          const lines = data.split('\n').map(line => (colorfulOutput ? colorizeLogLevel(line) : line)); //todo when JSONColorize gets merged this will change
          callback(lines.join('\n'));
        };

  const options: PodLogsOptions = {
    stream: isStreaming,
    previous,
    tailLines,
    sinceSeconds,
    timestamps,
  };

  const subscriptionPromises = (object.spec?.containers.map(c => c.name) ?? []).map(async containerName => {
    return await streams.streamPodLogs.subscribe(
      object.metadata?.name ?? '',
      object.metadata?.namespace ?? '',
      containerName,
      chunk => {
        multiContainers(containerName, chunk.data, data => {
          if (noLogs) {
            noLogs = false;
          }
          logsTerminal?.write(data + '\r', triggerResize);
        });
      },
      options,
    );
  });

  const subscriptions = await Promise.all(subscriptionPromises);
  disposables.push(...subscriptions);
}

let unsubscribers: Unsubscriber[] = [];
let settingsMenuRef: HTMLDivElement | undefined;

onMount(() => {
  unsubscribers.push(terminalSettingsState.subscribe());
  // Initial load since $effect.pre skips the first run
  loadLogs().catch(console.error);

  // Close settings menu when clicking outside
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
  unsubscribers.forEach(unsubscriber => unsubscriber());
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];
});
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-4 p-4 bg-(--pd-content-header-bg) border-b border-(--pd-content-divider)">
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          bind:group={isStreaming}
          value={true}
          class="cursor-pointer"
          onchange={handleSettingChange} />
        <span class="text-sm">Stream</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          bind:group={isStreaming}
          value={false}
          class="cursor-pointer"
          onchange={handleSettingChange} />
        <span class="text-sm">Retrieve</span>
      </label>
    </div>

    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={previous} class="cursor-pointer" onchange={handleSettingChange} />
      <span class="text-sm">Previous</span>
    </label>

    <label class="flex items-center gap-2">
      <span class="text-sm">Tail:</span>
      <input
        type="number"
        bind:value={tailLines}
        placeholder="All"
        class="w-24 px-2 py-1 bg-(--pd-input-field-bg) text-(--pd-input-field-focused-text) border border-(--pd-input-field-stroke) rounded"
        min="1" />
    </label>

    <label class="flex items-center gap-2">
      <span class="text-sm">Since (seconds):</span>
      <input
        type="number"
        bind:value={sinceSeconds}
        placeholder="All"
        class="w-24 px-2 py-1 bg-(--pd-input-field-bg) text-(--pd-input-field-focused-text) border border-(--pd-input-field-stroke) rounded"
        min="1" />
    </label>

    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={timestamps} class="cursor-pointer" onchange={handleSettingChange} />
      <span class="text-sm">Timestamps</span>
    </label>

    <div class="ml-auto flex items-center gap-2">
      <div class="relative" bind:this={settingsMenuRef}>
        <button
          class="p-2 hover:bg-(--pd-content-card-hover-bg) rounded"
          onclick={(): boolean => (settingsMenuOpen = !settingsMenuOpen)}
          aria-label="Terminal settings">
          <Fa icon={faEllipsisV} />
        </button>
        {#if settingsMenuOpen}
          <div
            class="absolute right-0 mt-1 w-64 bg-(--pd-content-card-bg) border border-(--pd-content-divider) rounded shadow-lg z-10">
            <div class="p-3 space-y-3">
              <label class="flex items-center justify-between gap-2">
                <span class="text-sm">Font Size:</span>
                <input
                  type="number"
                  bind:value={fontSize}
                  class="w-20 px-2 py-1 bg-(--pd-input-field-bg) text-(--pd-input-field-focused-text) border border-(--pd-input-field-stroke) rounded"
                  min="8"
                  max="24" />
              </label>
              <label class="flex items-center justify-between gap-2">
                <span class="text-sm">Line Height:</span>
                <input
                  type="number"
                  bind:value={lineHeight}
                  class="w-20 px-2 py-1 bg-(--pd-input-field-bg) text-(--pd-input-field-focused-text) border border-(--pd-input-field-stroke) rounded"
                  min="1"
                  max="5"
                  step="0.1" />
              </label>
              <label class="flex items-center justify-between gap-2 cursor-pointer">
                <span class="text-sm">Colorful Output:</span>
                <input type="checkbox" bind:checked={colorfulOutput} class="cursor-pointer" />
              </label>
            </div>
          </div>
        {/if}
      </div>
      <Button on:click={loadLogs}>
        {isStreaming ? 'Restart Stream' : 'Retrieve Logs'}
        {#if hasUnsyncedChanges}
          <Tooltip tip="Click to sync changes">
            <Fa icon={faCircleInfo} class="text-(--pd-input-field-focused-text)" />
          </Tooltip>
        {/if}
      </Button>
    </div>
  </div>

  {#if noLogs}
    <EmptyScreen icon={NoLogIcon} title="No Log" message="Log output of Pod {object.metadata?.name}" />
  {/if}

  <div
    class="min-w-full flex flex-col overflow-hidden"
    class:invisible={noLogs === true}
    class:h-0={noLogs === true}
    class:flex-1={noLogs === false}>
    <TerminalWindow
      class="h-full"
      bind:terminal={logsTerminal}
      convertEol
      disableStdIn
      fontSize={fontSize}
      lineHeight={lineHeight}
      lineCount={tailLines ?? lineCount} />
  </div>
</div>
