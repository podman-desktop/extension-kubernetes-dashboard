<script lang="ts">
import type { IDisposable } from '@kubernetes-dashboard/channels';
import type { V1Pod } from '@kubernetes/client-node';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import type { Terminal } from '@xterm/xterm';
import { getContext, onDestroy, onMount, tick } from 'svelte';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import TerminalWindow from '/@/component/terminal/TerminalWindow.svelte';
import { Streams } from '/@/stream/streams';
import { PodLogsHelper } from '/@/component/pods/pod-logs-helper';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

interface Props {
  object: V1Pod;
  // undefined means logs for all containers are displayed
  containerName?: string;
  colorizer: string;
  timestamps: boolean;
  previous: boolean;
  tailLines?: string;
  sinceSeconds?: string;
}
let { object, containerName, colorizer, timestamps, previous, tailLines = '1060', sinceSeconds }: Props = $props();

// Logs has been initialized
let noLogs = $state<boolean>();

let logsTerminal = $state<Terminal>();

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podLogsHelper = dependencyAccessor.get<PodLogsHelper>(PodLogsHelper);

// This component is not reactive, it must be unmounted and mounted again when options change
// using the #key directive
onMount(async () => {
  const containers =
    (containerName ? object.spec?.containers.filter(c => c.name === containerName) : object.spec?.containers) ?? [];

  podLogsHelper.init(containers, colorizer);
  logsTerminal?.clear();

  for (const name of containers.map(c => c.name)) {
    disposables.push(
      await streams.streamPodLogs.subscribe(
        object.metadata?.name ?? '',
        object.metadata?.namespace ?? '',
        name,
        {
          timestamps,
          previous,
          tailLines: getFiniteNumber(tailLines),
          sinceSeconds: getFiniteNumber(sinceSeconds),
        },
        chunk => {
          const data = podLogsHelper.transformPodLogs(name, chunk.data);
          noLogs = false;
          logsTerminal?.write(data + '\r');
          tick()
            .then(() => {
              window.dispatchEvent(new Event('resize'));
            })
            .catch(console.error);
        },
      ),
    );
  }
  // there is no wait to be sure there is no logs, except to wait a few moment
  setTimeout(() => {
    noLogs ??= true;
  }, 1_000);
});

function getFiniteNumber(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const number = parseInt(value);
  return isNaN(number) ? undefined : number;
}

onDestroy(() => {
  disposables.forEach(disposable => disposable.dispose());
  disposables = [];
});
</script>

{#if noLogs === true}
  <EmptyScreen class="min-w-full" icon={NoLogIcon} title="No Log" message="Log output of Pod {object.metadata?.name}" />
{:else}
  <div class="h-full min-w-full flex flex-col">
    <TerminalWindow class="h-full" bind:terminal={logsTerminal} convertEol disableStdIn search />
  </div>
{/if}
