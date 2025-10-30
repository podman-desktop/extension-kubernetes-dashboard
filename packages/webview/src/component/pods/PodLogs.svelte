<script lang="ts">
  import type { V1Pod } from '@kubernetes/client-node';
  import { getContext, onDestroy, onMount, tick } from 'svelte';
  import { Streams } from '/@/stream/streams';
  import type { IDisposable, PodLogsOptions } from '@kubernetes-dashboard/channels';
  import { EmptyScreen, Button, Input } from '@podman-desktop/ui-svelte';
  import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
  import type { Terminal } from '@xterm/xterm';
  import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { ansi256Colours, colourizedANSIContainerName, colorizeLogLevel } from '/@/component/terminal/terminal-colors';

  interface Props {
  object: V1Pod;
  }
  let { object }: Props = $props();

  // Logs has been initialized
  let noLogs = $state(true);

  let logsTerminal = $state<Terminal>();

  // Log retrieval mode and options
  let isStreaming = $state(true);
  let previous = $state(false);
  let tailLines = $state<number | undefined>(undefined);
  let sinceSeconds = $state<number | undefined>(undefined);
  let timestamps = $state(false);
  let fontSize = $state(10);

  let disposables: IDisposable[] = [];
  const streams = getContext<Streams>(Streams);

  // Create a map that will store the ANSI 256 colour for each container name
  // if we run out of colours, we'll start from the beginning.
  const colourizedContainerName = new SvelteMap<string, string>();

  async function loadLogs() {
    logsTerminal?.clear();
    noLogs = true;
  
    disposables.forEach(disposable => disposable.dispose());
    disposables = [];

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
              .map(line => colorizeLogLevel(line))
              .map((line, index, arr) =>
                index < arr.length - 1 || line.length > 0 ? `${padding}${colouredName}|${line}` : line,
              );
            callback(lines.join('\n'));
          }
        : (_name: string, data: string, callback: (data: string) => void): void => {
            const lines = data
              .split('\n')
              .map(line => colorizeLogLevel(line));
            callback(lines.join('\n'));
          };								
      
      const options: PodLogsOptions = {
        stream: isStreaming,
        previous,
        tailLines,
        sinceSeconds,
        timestamps,
      };
                  
      for (const containerName of object.spec?.containers.map(c => c.name) ?? []) {
        disposables.push(
          await streams.streamPodLogs.subscribe(
            object.metadata?.name ?? '',
            object.metadata?.namespace ?? '',
            containerName,
            options,
            chunk => {
              multiContainers(containerName, chunk.data, data => {
                if (noLogs) {
                  noLogs = false;
                }
                logsTerminal?.write(data + '\r');
                tick().then(() => {
                    window.dispatchEvent(new Event('resize'));
                }).catch(console.error);
              });
            }),
        );
      }
  }

  onMount(async () => {
    await loadLogs();
  });

  onDestroy(() => {
    disposables.forEach(disposable => disposable.dispose());
    disposables = [];
  });
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-4 p-4 bg-[var(--pd-content-header-bg)] border-b border-[var(--pd-content-divider)]">
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" bind:group={isStreaming} value={true} class="cursor-pointer" />
        <span class="text-sm">Stream</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" bind:group={isStreaming} value={false} class="cursor-pointer" />
        <span class="text-sm">Retrieve</span>
      </label>
    </div>

    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={previous} class="cursor-pointer" />
      <span class="text-sm">Previous</span>
    </label>

    <label class="flex items-center gap-2">
      <span class="text-sm">Tail:</span>
      <Input
        type="number"
        bind:value={tailLines}
        placeholder="All"
        class="w-24"
        min="1"
      />
    </label>

    <label class="flex items-center gap-2">
      <span class="text-sm">Since (seconds):</span>
      <Input
        type="number"
        bind:value={sinceSeconds}
        placeholder="All"
        class="w-24"
        min="1"
      />
    </label>

    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={timestamps} class="cursor-pointer" />
      <span class="text-sm">Timestamps</span>
    </label>

    <label class="flex items-center gap-2">
      <span class="text-sm">Font Size:</span>
      <Input type="number" bind:value={fontSize} class="w-20" min="8" max="24" />
    </label>

    <Button on:click={loadLogs} class="ml-auto">
      {isStreaming ? 'Restart Stream' : 'Retrieve Logs'}
    </Button>
  </div>

  <EmptyScreen
    icon={NoLogIcon}
    title="No Log"
    message="Log output of Pod {object.metadata?.name}"
    hidden={noLogs === false} />

  <div
    class="min-w-full flex flex-col"
    class:invisible={noLogs === true}
    class:h-0={noLogs === true}
    class:flex-1={noLogs === false}>
    <TerminalWindow class="h-full" bind:terminal={logsTerminal} convertEol disableStdIn fontSize={fontSize} />
  </div>
</div>
