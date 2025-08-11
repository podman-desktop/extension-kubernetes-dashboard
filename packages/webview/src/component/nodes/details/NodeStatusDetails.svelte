<script lang="ts">
import type { V1NodeStatus } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';
import ConditionsTable from '/@/component/objects/details/ConditionsTable.svelte';

interface Props {
  status: V1NodeStatus;
}
let { status }: Props = $props();
</script>

{#if status.nodeInfo}
  <tr>
    <Title>Node Info</Title>
  </tr>
  <tr>
    <Cell>Architecture</Cell>
    <Cell>{status.nodeInfo.architecture}</Cell>
  </tr>
  <tr>
    <Cell>Boot ID</Cell>
    <Cell>{status.nodeInfo.bootID}</Cell>
  </tr>
  <tr>
    <Cell>Container Runtime Version</Cell>
    <Cell>{status.nodeInfo.containerRuntimeVersion}</Cell>
  </tr>
  <tr>
    <Cell>Kernel Version</Cell>
    <Cell>{status.nodeInfo.kernelVersion}</Cell>
  </tr>
  <tr>
    <Cell>Kubelet Version</Cell>
    <Cell>{status.nodeInfo.kubeletVersion}</Cell>
  </tr>
  <tr>
    <Cell>Kube Proxy Version</Cell>
    <Cell>{status.nodeInfo.kubeProxyVersion}</Cell>
  </tr>
  <tr>
    <Cell>Machine ID</Cell>
    <Cell>{status.nodeInfo.machineID}</Cell>
  </tr>
  <tr>
    <Cell>Operating System</Cell>
    <Cell>{status.nodeInfo.operatingSystem}</Cell>
  </tr>
  <tr>
    <Cell>OS Image</Cell>
    <Cell>{status.nodeInfo.osImage}</Cell>
  </tr>
  <tr>
    <Cell>System UUID</Cell>
    <Cell>{status.nodeInfo.systemUUID}</Cell>
  </tr>
{/if}
<tr>
  <Title>Status</Title>
</tr>
{#if status.conditions}
  <tr>
    <Title>Conditions</Title>
  </tr>
  <ConditionsTable conditions={status.conditions} />
{/if}
{#if status.addresses}
  <tr>
    <Title>Addresses</Title>
  </tr>
  {#each status.addresses as address, index (index)}
    <tr>
      <Cell>{address.type}</Cell>
      <Cell>{address.address}</Cell>
    </tr>
  {/each}
{/if}
{#if status.capacity}
  <tr>
    <Title>Capacity</Title>
  </tr>
  {#each Object.entries(status.capacity) as [key, value] (key)}
    <tr>
      <Cell>{key}</Cell>
      <Cell>{value}</Cell>
    </tr>
  {/each}
{/if}
{#if status.allocatable}
  <tr>
    <Title>Allocatable</Title>
  </tr>
  {#each Object.entries(status.allocatable) as [key, value] (key)}
    <tr>
      <Cell>{key}</Cell>
      <Cell>{value}</Cell>
    </tr>
  {/each}
{/if}
