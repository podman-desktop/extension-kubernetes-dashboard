<script lang="ts">
import { getContext, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';

const activeResourcesCount = getContext<States>(States).stateActiveResourcesCountInfoUI;

onMount(() => {
  return activeResourcesCount.subscribe();
});
</script>

<NavPage title="Active resources count" searchEnabled={false}>
  {#snippet content()}
    {#if activeResourcesCount.data?.counts}
      <ul>
        {#each activeResourcesCount.data.counts as count, index (index)}
          <li>{count.contextName}/{count.resourceName}: {count.count}</li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</NavPage>
