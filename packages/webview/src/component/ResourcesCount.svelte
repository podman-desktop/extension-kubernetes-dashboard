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
    <main class="flex flex-col w-screen h-screen overflow-auto bg-[var(--pd-content-bg)] text-base m-4">
      {#if resourcesCount.data?.counts}
        <ul class="list-disc list-inside">
          {#each resourcesCount.data.counts as count, index (index)}
            <li>{count.contextName}/{count.resourceName}: {count.count}</li>
          {/each}
        </ul>
      {/if}
    </main>
  {/snippet}
</NavPage>
