<script lang="ts">
import { onMount } from 'svelte';
import { listenActiveResourcesCount } from '/@/listener/active-resources-count-listen';
import type { ResourceCount } from '/@common/model/kubernetes-resource-count';

let activeResourcesCounts = $state<ResourceCount[]>();

onMount(() => {
  return listenActiveResourcesCount((counts: ResourceCount[]) => {
    activeResourcesCounts = counts;
  });
});
</script>

{#if activeResourcesCounts}
  <ul>
    {#each activeResourcesCounts as count, index (index)}
      <li>{count.contextName}/{count.resourceName}: {count.count}</li>
    {/each}
  </ul>
{/if}
