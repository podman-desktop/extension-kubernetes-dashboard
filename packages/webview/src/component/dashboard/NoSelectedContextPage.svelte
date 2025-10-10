<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '/@common/index';

interface Props {
  availableContexts?: string[];
}
const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

let { availableContexts }: Props = $props();
</script>

<div class="mt-8 flex justify-center overflow-auto">
  <div class="max-w-[600px] flex flex-col text-center space-y-3">
    <div class="flex justify-center text-[var(--pd-details-empty-icon)] py-2">
      <KubeIcon size="80" />
    </div>
    <h1 class="text-xl text-[var(--pd-details-empty-header)]">No Kubernetes context selected</h1>
    <div class="text-[var(--pd-details-empty-sub-header)] text-pretty">
      No Kubernetes context is currently selected. Please select a context to continue.
    </div>
    <div class="text-[var(--pd-details-empty-sub-header)] text-pretty">
      Available contexts:
      {#if availableContexts}
        {#each availableContexts as context, index (index)}
          <Link on:click={(): Promise<void> => contextsApi.setCurrentContext(context)}>{context}</Link
          >{#if index < availableContexts.length - 1},
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</div>
