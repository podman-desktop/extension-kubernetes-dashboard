<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { getContext, onDestroy, onMount, tick } from 'svelte';
import { Streams } from '/@/stream/streams';
import type { IDisposable } from '@kubernetes-dashboard/channels';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
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

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

// Create a map that will store the ANSI 256 colour for each container name
// if we run out of colours, we'll start from the beginning.
const colourizedContainerName = new SvelteMap<string, string>();

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

  for (const containerName of object.spec?.containers.map(c => c.name) ?? []) {
    disposables.push(
      await streams.streamPodLogs.subscribe(
        object.metadata?.name ?? '',
        object.metadata?.namespace ?? '',
        containerName,
        chunk => {
          multiContainers(containerName, chunk.data, data => {
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
