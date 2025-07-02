<script lang="ts">
import { getContext } from 'svelte';
import { States } from '/@/state/states';

const resourcesCount = getContext<States>(States).stateResourcesCountInfoUI;
</script>

{#if resourcesCount.data?.counts}
  <ul>
    {#each resourcesCount.data.counts as count, index (index)}
      <li>{count.contextName}/{count.resourceName}: {count.count}</li>
    {/each}
  </ul>
{/if}
