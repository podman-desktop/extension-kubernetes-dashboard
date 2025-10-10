<script lang="ts">
import { Expandable, Link } from '@podman-desktop/ui-svelte';
import DashboardResources from './DashboardResources.svelte';
import CurrentContextConnectionBadge from '/@/component/connection/CurrentContextConnectionBadge.svelte';
import { Remote } from '/@/remote/remote';
import { getContext, onDestroy, onMount } from 'svelte';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';
import { States } from '/@/state/states';
import DashboardGuideCard from './DashboardGuideCard.svelte';

import deployAndTestKubernetesImage from './images/DeployAndTestKubernetes.png';
import shareYourLocalProdmanImagesWithTheKubernetesImage from './images/ShareYourLocalPodmanImagesWithTheKubernetes.png';
import workingWithKubernetesImage from './images/WorkingWithKubernetes.png';
import type { Unsubscriber } from 'svelte/store';
import CheckConnection from '/@/component/connection/CheckConnection.svelte';

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const currentContextName = $derived(currentContext.data?.contextName);

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function openKubernetesDocumentation(): Promise<void> {
  await systemApi.openExternal('https://podman-desktop.io/docs/kubernetes');
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
          <div class="text-xl font-bold capitalize text-[var(--pd-content-header)]">Dashboard</div>
          <div class="flex grow justify-end"><CurrentContextConnectionBadge /></div>
        </div>
      {/snippet}
      <div class="flex flex-col gap-4">
        <div>
          Here you can manage and interact with Kubernetes clusters with features like connecting to clusters, and
          viewing workloads like deployments and services.
        </div>
        <div>Get up and running by clicking one of the menu items!</div>
        <div>
          <Link class="place-self-start" on:click={openKubernetesDocumentation}>Kubernetes documentation</Link>
        </div>
      </div>
    </Expandable>
  </div>

  <div class="flex w-full h-full overflow-auto">
    <div class="flex min-w-full h-full justify-center">
      <div class="flex flex-col space-y-4 min-w-full overflow-y-auto">
        <div class="flex flex-col gap-4 bg-[var(--pd-content-card-bg)] grow p-5">
          {#if currentContextName}
            <!-- Metrics - non-collapsible -->
            <div class="flex flex-row">
              <div class="text-xl grow">Metrics</div>
              <div><CheckConnection /></div>
            </div>
            <DashboardResources />
          {/if}
          <!-- Articles and blog posts - collapsible -->
          <div class="flex flex-1 flex-col pt-2">
            <Expandable>
              <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
              {#snippet title()}<div class="text-xl">Explore articles and blog posts</div>{/snippet}
              <div class="grid grid-cols-3 gap-4 pt-2">
                <DashboardGuideCard
                  title="Deploy and test Kubernetes containers using Podman Desktop"
                  image={deployAndTestKubernetesImage}
                  link="https://developers.redhat.com/articles/2023/06/09/deploy-and-test-kubernetes-containers-using-podman-desktop" />
                <DashboardGuideCard
                  title="Working with Kubernetes in Podman Desktop"
                  image={workingWithKubernetesImage}
                  link="https://developers.redhat.com/articles/2023/11/06/working-kubernetes-podman-desktop" />
                <DashboardGuideCard
                  title="Share your local podman images with the Kubernetes cluster"
                  image={shareYourLocalProdmanImagesWithTheKubernetesImage}
                  link="https://podman-desktop.io/blog/sharing-podman-images-with-kubernetes-cluster" />
              </div>
            </Expandable>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
