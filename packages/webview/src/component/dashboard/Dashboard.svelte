<script lang="ts">
import { Button, Expandable, Link } from '@podman-desktop/ui-svelte';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { router } from 'tinro';
import DashboardResources from './DashboardResources.svelte';
import CurrentContextConnectionBadge from '/@/component/connection/CurrentContextConnectionBadge.svelte';
import { Remote } from '/@/remote/remote';
import { getContext, onDestroy, onMount } from 'svelte';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import { States } from '/@/state/states';
import DashboardGuideCard from './DashboardGuideCard.svelte';

import type { Unsubscriber } from 'svelte/store';
import CheckConnection from '/@/component/connection/CheckConnection.svelte';
import product from '/@/../../../product.json' with { type: 'json' };

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const currentContextName = $derived(currentContext.data?.contextName);

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function openKubernetesDocumentation(): Promise<void> {
  await systemApi.openExternal(product.links?.kubernetesDocumentation);
}

let unsubscribers: Unsubscriber[] = [];
onMount(() => {
  unsubscribers.push(currentContext.subscribe());
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
  unsubscribers = [];
});
</script>

<div class="flex flex-col w-full h-full pt-4">
  <!-- Details - collapsible -->
  <div class="flex flex-row w-full px-5 pb-2">
    <Expandable>
      <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
      {#snippet title()}
        <div class="flex flex-row w-full items-center">
          <div class="text-xl font-bold capitalize text-(--pd-content-header)">Dashboard</div>
          <div class="flex grow justify-end items-center gap-3">
            <CurrentContextConnectionBadge />
            <Button on:click={(): void => router.goto('/newCluster')} icon={faPlus}>New Cluster…</Button>
          </div>
        </div>
      {/snippet}

      <div class="flex flex-col gap-4">
        <div>
          Here you can manage and interact with Kubernetes clusters with features like connecting to clusters, and
          viewing workloads like deployments and services.
        </div>
        <div>Get up and running by clicking one of the menu items!</div>
        {#if product.links?.kubernetesDocumentation}
          <div>
            <Link class="place-self-start" on:click={openKubernetesDocumentation}>Kubernetes documentation</Link>
          </div>
        {/if}
      </div>
    </Expandable>
  </div>

  <div class="flex w-full h-full overflow-auto">
    <div class="flex min-w-full h-full justify-center">
      <div class="flex flex-col space-y-4 min-w-full overflow-y-auto">
        <div class="flex flex-col gap-4 bg-(--pd-content-card-bg) grow p-5">
          {#if currentContextName}
            <!-- Metrics - non-collapsible -->
            <div class="flex flex-row">
              <div class="text-xl grow">Metrics</div>
              <div><CheckConnection /></div>
            </div>
            <DashboardResources />
          {/if}
          <!-- Articles and blog posts - collapsible -->
          {#if product.dashboardGuidesCards}
            <div class="flex flex-1 flex-col pt-2">
              <Expandable>
                <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
                {#snippet title()}<div class="text-xl">Explore articles and blog posts</div>{/snippet}
                <div class="grid grid-cols-3 gap-4 pt-2">
                  {#each product.dashboardGuidesCards as card}
                    <DashboardGuideCard title={card.title} image={`${card.image}`} link={card.link} />
                  {/each}
                </div>
              </Expandable>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
