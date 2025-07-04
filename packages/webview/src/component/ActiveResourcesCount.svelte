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
    <main class="flex flex-col w-screen h-screen overflow-auto bg-[var(--pd-content-bg)] text-base m-4">
      {#if activeResourcesCount.data?.counts}
        <ul class="list-disc list-inside">
          {#each activeResourcesCount.data.counts as count, index (index)}
            <li>{count.contextName}/{count.resourceName}: {count.count}</li>
          {/each}
        </ul>
      {/if}
    </main>
  {/snippet}
</NavPage>
