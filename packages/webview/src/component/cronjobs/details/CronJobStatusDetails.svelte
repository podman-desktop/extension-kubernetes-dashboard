<script lang="ts">
import type { V1CronJobStatus } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';

interface Props {
  status: V1CronJobStatus;
}

let { status }: Props = $props();
</script>

{#if status.lastScheduleTime ?? status.lastSuccessfulTime ?? status.active}
  <tr>
    <Title>Status</Title>
  </tr>
  {#if status.lastScheduleTime}
    <tr>
      <Cell>Last Schedule Time</Cell>
      <Cell>{status.lastScheduleTime}</Cell>
    </tr>
  {/if}
  {#if status.lastSuccessfulTime}
    <tr>
      <Cell>Last Successful Time</Cell>
      <Cell>{status.lastSuccessfulTime}</Cell>
    </tr>
  {/if}
  {#if status.active}
    <tr>
      <Cell>Active Jobs</Cell>
      <Cell>
        {#each status.active as job (job.name)}
          {job.name}
          <br />
        {/each}
      </Cell>
    </tr>
  {/if}
{/if}
