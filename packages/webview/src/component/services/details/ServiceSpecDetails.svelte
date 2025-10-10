<script lang="ts">
import type { V1ServiceSpec } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import KubePortsList from '/@/component/port-forward/KubePortsList.svelte';
import { WorkloadKind } from '@kubernetes-dashboard/channels';

interface Props {
  spec: V1ServiceSpec;
  serviceName?: string;
  namespace?: string;
}
let { spec, serviceName, namespace }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
<tr>
  <Cell>Type</Cell>
  <Cell>{spec.type}</Cell>
</tr>
<tr>
  <Cell>Cluster IP</Cell>
  <Cell>{spec.clusterIP}</Cell>
</tr>
{#if spec.externalIPs}
  <tr>
    <Cell>External IPs</Cell>
    <Cell>{spec.externalIPs?.join(', ') || ''}</Cell>
  </tr>
{/if}
<tr>
  <Cell>Session Affinity</Cell>
  <Cell>{spec.sessionAffinity}</Cell>
</tr>
<KubePortsList
  namespace={namespace}
  resourceName={serviceName}
  kind={WorkloadKind.SERVICE}
  ports={spec.ports?.map(port => ({
    name: port.name,
    value: port.port,
    protocol: port.protocol,
    displayValue: `${port.name ? port.name + ':' : ''}${port.port}${port.nodePort ? ':' + port.nodePort : ''}/${port.protocol}`,
  }))} />
{#if spec.selector}
  <tr>
    <Cell>Selectors</Cell>
    <Cell>
      {#each Object.entries(spec.selector) as [key, value] (key)}
        <div>{key}: {value}</div>
      {/each}
    </Cell>
  </tr>
{/if}
