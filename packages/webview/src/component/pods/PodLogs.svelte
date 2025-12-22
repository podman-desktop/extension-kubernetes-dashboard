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
}
let { object }: Props = $props();

// Logs has been initialized
let noLogs = $state(true);

let logsTerminal = $state<Terminal>();

let disposables: IDisposable[] = [];
const streams = getContext<Streams>(Streams);

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podLogsHelper = dependencyAccessor.get<PodLogsHelper>(PodLogsHelper);

onMount(async () => {
  podLogsHelper.init(object.spec?.containers ?? []);
  logsTerminal?.clear();

  for (const containerName of object.spec?.containers.map(c => c.name) ?? []) {
    disposables.push(
      await streams.streamPodLogs.subscribe(
        object.metadata?.name ?? '',
        object.metadata?.namespace ?? '',
        containerName,
        chunk => {
          const data = podLogsHelper.transformPodLogs(containerName, chunk.data);
          if (noLogs) {
            noLogs = false;
          }
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
