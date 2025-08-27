<script lang="ts">
import type { V1JobStatus } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';

interface Props {
  status: V1JobStatus;
}

let { status }: Props = $props();
</script>

{#if status.active ?? status.succeeded ?? status.failed ?? status.startTime ?? status.completionTime}
  <tr>
    <Title>Status</Title>
  </tr>
  {#if status.active !== undefined}
    <tr>
      <Cell>Active Jobs</Cell>
      <Cell>{status.active}</Cell>
    </tr>
  {/if}
  {#if status.succeeded !== undefined}
    <tr>
      <Cell>Succeeded</Cell>
      <Cell>{status.succeeded}</Cell>
    </tr>
  {/if}
  {#if status.failed !== undefined}
    <tr>
      <Cell>Failed</Cell>
      <Cell>{status.failed}</Cell>
    </tr>
  {/if}
  {#if status.startTime}
    <tr>
      <Cell>Start Time</Cell>
      <Cell>{status.startTime}</Cell>
    </tr>
  {/if}
  {#if status.completionTime}
    <tr>
      <Cell>Completion Time</Cell>
      <Cell>{status.completionTime}</Cell>
    </tr>
  {/if}
{/if}
