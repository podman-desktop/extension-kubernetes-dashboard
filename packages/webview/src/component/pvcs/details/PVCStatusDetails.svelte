<script lang="ts">
import type { V1PersistentVolumeClaimStatus } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';

interface Props {
  status: V1PersistentVolumeClaimStatus;
}
let { status }: Props = $props();
</script>

<tr>
  <Title>Status</Title>
</tr>
{#if status.phase}
  <tr>
    <Cell>Phase</Cell>
    <Cell>{status.phase}</Cell>
  </tr>
{/if}
{#if status.accessModes}
  <tr>
    <Cell>Access Modes</Cell>
    <Cell>
      {#each status.accessModes as mode, index (index)}
        <div>{mode}</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if status.capacity}
  <tr>
    <Cell>Capacity</Cell>
    <Cell>
      <table>
        <tbody>
          {#each Object.entries(status.capacity) as [resource, quantity] (resource)}
            <tr>
              <Cell>{resource}: {quantity}</Cell>
            </tr>
          {/each}
        </tbody>
      </table>
    </Cell>
  </tr>
{/if}
{#if status.conditions}
  <tr>
    <Title>Conditions</Title>
    <Cell>
      <table>
        <tbody>
          {#each status.conditions as condition, index (index)}
            <tr>
              <Cell>Type: {condition.type}</Cell>
              <Cell
                >Status: {condition.status}, LastProbeTime: {condition.lastProbeTime ?? 'N/A'}, LastTransitionTime: {condition.lastTransitionTime ??
                  'N/A'}</Cell>
            </tr>
          {/each}
        </tbody>
      </table>
    </Cell>
  </tr>
{/if}
