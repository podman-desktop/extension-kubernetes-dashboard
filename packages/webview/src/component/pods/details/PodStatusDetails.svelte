<script lang="ts">
import type { V1PodStatus } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';
import Title from '/@/component/details/Title.svelte';

interface Props {
  status: V1PodStatus;
}

let { status }: Props = $props();

if (status.startTime) {
  status.startTime = new Date(status.startTime);
}
</script>

<tr>
  <Title>Status</Title>
</tr>
<tr>
  <Cell>Phase</Cell>
  <Cell>{status.phase}</Cell>
</tr>
<tr>
  <Cell>Pod IP</Cell>
  <Cell>{status.podIP}</Cell>
</tr>
<tr>
  <Cell>Host IP</Cell>
  <Cell>{status.hostIP}</Cell>
</tr>
<tr>
  <Cell>Start Time</Cell>
  <Cell>{status.startTime}</Cell>
</tr>

<!-- If containerStatus and at least one in the array has a 'state' that's not undefined.
  as the "state" information is where the warning is (unable to pull image, etc.) -->
{#if status.containerStatuses?.some(containerStatus => containerStatus.state)}
  <tr>
    <Title>Container Status</Title>
  </tr>
  {#each status.containerStatuses as containerStatus, index (index)}
    {#if containerStatus.state}
      <tr>
        <Subtitle>{containerStatus.name}</Subtitle>
      </tr>
      {#if containerStatus.state.waiting}
        <tr>
          <Cell>Waiting</Cell>
          <Cell>{containerStatus.state.waiting.reason}</Cell>
        </tr>
        <tr>
          <Cell>Message</Cell>
          <Cell>{containerStatus.state.waiting.message}</Cell>
        </tr>
      {/if}
      {#if containerStatus.state.terminated}
        <tr>
          <Cell>Terminated</Cell>
          <Cell>{containerStatus.state.terminated.reason}</Cell>
        </tr>
        <tr>
          <Cell>Exit Code</Cell>
          <Cell>{containerStatus.state.terminated.exitCode}</Cell>
        </tr>
      {/if}
    {/if}
  {/each}
{/if}
