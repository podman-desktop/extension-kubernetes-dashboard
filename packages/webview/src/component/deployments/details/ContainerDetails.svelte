<script lang="ts">
import type { V1Container } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import type { WorkloadKind } from '@kubernetes-dashboard/channels';
import KubePortsList from '/@/component/port-forward/KubePortsList.svelte';

interface Props {
  kind: WorkloadKind.POD | WorkloadKind.DEPLOYMENT;
  container: V1Container;
  resourceName?: string;
  namespace?: string;
}
let { kind, container, resourceName, namespace }: Props = $props();
</script>

<tr>
  <Cell>Name</Cell>
  <Cell>{container.name}</Cell>
</tr>
<tr>
  <Cell>Image</Cell>
  <Cell>{container.image}</Cell>
</tr>
<tr>
  <Cell>Image Pull Policy</Cell>
  <Cell>{container.imagePullPolicy}</Cell>
</tr>
<KubePortsList
  namespace={namespace}
  resourceName={resourceName}
  kind={kind}
  ports={container.ports?.map(port => ({
    name: port.name,
    value: port.containerPort,
    protocol: port.protocol,
    displayValue: `${port.name ? port.name + ':' : ''}${port.containerPort}/${port.protocol}`,
  }))} />
{#if container.env}
  <tr>
    <Cell>Environment Variables</Cell>
    <Cell>
      {#each container.env ? container.env.map(e => `${e.name}: ${e.value}`) : [] as env (env)}
        <div>{env}</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if container.volumeMounts}
  <tr>
    <Cell>Volume Mounts</Cell>
    <Cell>{container.volumeMounts?.map(vm => vm.name).join(', ') || ''}</Cell>
  </tr>
{/if}
