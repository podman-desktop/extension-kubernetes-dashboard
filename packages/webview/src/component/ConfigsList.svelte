<script lang="ts">
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';
import type { Unsubscriber } from 'svelte/store';
import type { ContextResourceItems } from '/@common/model/context-resources-items';
import { DependencyAccessor } from '../inject/dependency-accessor';
import { Navigator } from '/@/navigation/navigator';

const updateResource = getContext<States>(States).stateUpdateResourceInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get(Navigator);

let unsubscriberConfigmaps: Unsubscriber | undefined;
let unsubscriberSecrets: Unsubscriber | undefined;

$effect(() => {
  // first unsubscribe from previous context
  unsubscribeFromContext();
  if (currentContext.data?.contextName) {
    subscribeToContext(currentContext.data.contextName);
  }
});

function subscribeToContext(contextName: string): void {
  unsubscriberConfigmaps = updateResource.subscribe({
    contextName: contextName,
    resourceName: 'configmaps',
  });
  unsubscriberSecrets = updateResource.subscribe({
    contextName: contextName,
    resourceName: 'secrets',
  });
}

function unsubscribeFromContext(): void {
  unsubscriberConfigmaps?.();
  unsubscriberSecrets?.();
}

onMount(() => {
  // returns the unsubscriber, which will be called automatically at destroy time
  return currentContext.subscribe();
});

onDestroy(() => {
  unsubscribeFromContext();
});

function filterResources(allResources: ContextResourceItems[]): ContextResourceItems[] {
  return allResources.filter(
    resources =>
      resources.contextName === currentContext.data?.contextName &&
      ['configmaps', 'secrets'].includes(resources.resourceName),
  );
}
</script>

<NavPage title="Configmaps and Secrets List" searchEnabled={false}>
  {#snippet content()}
    <main class="flex flex-col h-screen overflow-auto bg-[var(--pd-content-bg)] text-base m-4">
      context: {currentContext.data?.contextName}
      {#if updateResource.data}
        {#each filterResources(updateResource.data.resources) as resources, index (index)}
          <h2>List of {resources.resourceName} in context {resources.contextName}</h2>
          <ul class="list-disc list-inside">
            {#each resources.items as item, index (index)}
              <li>{item.metadata?.name} ({navigator.kubernetesResourcesURL('ConfigMap')})</li>
            {/each}
          </ul>
        {/each}
      {/if}
    </main>
  {/snippet}
</NavPage>
