<script lang="ts">
import Cell from '/@/component/details/Cell.svelte';
import type { ForwardConfig, WorkloadKind } from '@kubernetes-dashboard/channels';
import type { KubePortInfo } from './kube-port';
import KubePort from './KubePort.svelte';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';

interface Props {
  ports?: KubePortInfo[];
  resourceName?: string;
  namespace?: string;
  kind: WorkloadKind;
}

let { ports, resourceName, namespace, kind }: Props = $props();

const portForwards = getContext<States>(States).statePortForwardsInfoUI;

let portForwardsUnsubscriber: Unsubscriber;
onMount(() => {
  portForwardsUnsubscriber = portForwards.subscribe();
});

onDestroy(() => {
  portForwardsUnsubscriber?.();
});

let forwardConfigs: Map<number, ForwardConfig> = $derived(
  new Map(
    portForwards.data?.portForwards
      .filter(forward => forward.kind === kind && forward.name === resourceName && forward.namespace === namespace)
      .map(config => [config.forward.remotePort, config]) ?? [],
  ),
);
</script>

{#if ports && ports.length > 0}
  <tr>
    <Cell class="flex">Ports</Cell>
    <Cell>
      <div class="flex gap-y-1 flex-col">
        {#each ports as port, index (index)}
          <KubePort
            namespace={namespace}
            kind={kind}
            resourceName={resourceName}
            port={port}
            forwardConfig={forwardConfigs.get(port.value)} />
        {/each}
      </div>
    </Cell>
  </tr>
{/if}
