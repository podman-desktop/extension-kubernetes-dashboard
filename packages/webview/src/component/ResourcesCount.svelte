<script lang="ts">
import { getContext, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';

const resourcesCount = getContext<States>(States).stateResourcesCountInfoUI;

onMount(() => {
  return resourcesCount.subscribe();
});
</script>

<NavPage title="Resources count" searchEnabled={false}>
  {#snippet content()}
    {#if resourcesCount.data?.counts}
      <ul>
        {#each resourcesCount.data.counts as count, index (index)}
          <li>{count.contextName}/{count.resourceName}: {count.count}</li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</NavPage>
