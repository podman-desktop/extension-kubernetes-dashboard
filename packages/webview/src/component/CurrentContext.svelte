<script lang="ts">
import { getContext, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';

const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

onMount(() => {
  return currentContext.subscribe();
});
</script>

<NavPage title="Current context" searchEnabled={false}>
  {#snippet content()}
    <main class="flex flex-col w-screen h-screen overflow-auto bg-[var(--pd-content-bg)] text-base m-4">
      {#if currentContext.data}
        {#if currentContext.data.contextName}
          <p>Current context: {currentContext.data.contextName}</p>
          <p>Current namespace: {currentContext.data.namespace}</p>
        {:else}
          No current context
        {/if}
      {/if}
    </main>
  {/snippet}
</NavPage>
