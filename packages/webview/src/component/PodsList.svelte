<script lang="ts">
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';
import type { Unsubscriber } from 'svelte/store';
import type { ContextResourceItems } from '/@common/model/context-resources-items';

const updateResource = getContext<States>(States).stateUpdateResourceInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

let unsubscriber: Unsubscriber | undefined;

$effect(() => {
  if (currentContext.data?.contextName) {
    subscribeToContext(currentContext.data.contextName);
  } else {
    unsubscriber?.();
  }
});

function subscribeToContext(contextName: string): void {
  unsubscriber?.();
  unsubscriber = updateResource.subscribe({
    contextName: contextName,
    resourceName: 'pods',
  });
}

onMount(() => {
  return currentContext.subscribe();
});

onDestroy(() => {
  unsubscriber?.();
});

function filterResources(allResources: ContextResourceItems[]): ContextResourceItems[] {
  return allResources.filter(
    resources => resources.contextName === currentContext.data?.contextName && resources.resourceName === 'pods',
  );
}
</script>

<NavPage title="Pods List" searchEnabled={false}>
  {#snippet content()}
    <main class="flex flex-col h-screen overflow-auto bg-[var(--pd-content-bg)] text-base m-4">
      context: {currentContext.data?.contextName}
      {#if updateResource.data}
        {#each filterResources(updateResource.data.resources) as resources, index (index)}
          <h2>List of {resources.resourceName} in context {resources.contextName}</h2>
          <ul class="list-disc list-inside">
            {#each resources.items as item, index (index)}
              <li>{item.metadata?.name}</li>
            {/each}
          </ul>
        {/each}
      {/if}
    </main>
  {/snippet}
</NavPage>
