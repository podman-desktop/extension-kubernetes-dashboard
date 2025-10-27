<script lang="ts">
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import KubernetesProviderCard from '/@/component/dashboard/KubernetesProviderCard.svelte';
import { Remote } from '/@/remote/remote';
import { API_NAVIGATION } from '@kubernetes-dashboard/channels';
import { Button } from '@podman-desktop/ui-svelte';

const states = getContext<States>(States);
const kubernetesProviders = states.stateKubernetesProvidersInfoUI;

const remote = getContext<Remote>(Remote);
const navigationApi = remote.getProxy(API_NAVIGATION);

let unsubscribers: Unsubscriber[] = [];
onMount(() => {
  unsubscribers.push(kubernetesProviders.subscribe());
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
  unsubscribers = [];
});
</script>

<div class="mt-8 flex justify-center overflow-auto">
  <div class="max-w-[800px] flex flex-col text-center content-center space-y-3">
    <div class="flex justify-center text-(--pd-details-empty-icon) py-2">
      <KubeIcon size="80" />
    </div>
    <h1 class="text-xl text-(--pd-details-empty-header)">No Kubernetes cluster</h1>
    <div class="text-(--pd-details-empty-sub-header) text-balance">
      A Kubernetes cluster is a group of nodes (virtual or physical) that run Kubernetes, a system for automating the
      deployment and management of containerized applications.
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 justify-center">
      {#each kubernetesProviders.data?.providers as provider (provider.id)}
        <KubernetesProviderCard provider={provider} />
      {/each}
    </div>

    <Button on:click={async (): Promise<void> => { await navigationApi.navigateToExtensionsCatalog('category:kubernetes keyword:provider'); }}>Add Kubernetes cluster</Button>
  </div>
</div>
