<script lang="ts">
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from '@podman-desktop/ui-svelte';
import Fa from 'svelte-fa';
import KubernetesIcon from '/@/component/icons/KubernetesIcon.svelte';
import type { Unsubscriber } from 'svelte/store';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { Navigator } from '/@/navigation/navigator';
import type { ResourceCount } from '@podman-desktop/kubernetes-dashboard-extension-api';

interface Props {
  type: string;
  resources: string[];
  kind: string;
  iconName?: string;
}

let { type, resources, kind, iconName = kind }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get<Navigator>(Navigator);

const activeResourcesCount = getContext<States>(States).stateActiveResourcesCountInfoUI;
const resourcesCount = getContext<States>(States).stateResourcesCountInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;
const contextsPermissions = getContext<States>(States).stateContextsPermissionsInfoUI;

let unsubscriberActiveResources: Unsubscriber;
let unsubscriberResources: Unsubscriber;
let unsubscriberCurrentContext: Unsubscriber;
let unsubscriberContextsPermissions: Unsubscriber;

onMount(() => {
  subscribeToStates();
});

onDestroy(() => {
  unsubscribeFromStates();
});

function subscribeToStates(): void {
  unsubscriberActiveResources = activeResourcesCount.subscribe();
  unsubscriberResources = resourcesCount.subscribe();
  unsubscriberCurrentContext = currentContext.subscribe();
  unsubscriberContextsPermissions = contextsPermissions.subscribe();
}

function unsubscribeFromStates(): void {
  unsubscriberActiveResources?.();
  unsubscriberResources?.();
  unsubscriberCurrentContext?.();
  unsubscriberContextsPermissions?.();
}

function getCountForResource(data: ResourceCount[], resourceName: string): number | undefined {
  return data.find(c => c.contextName === currentContext.data?.contextName && c.resourceName === resourceName)?.count;
}

function getCountForResources(data: ResourceCount[] | undefined, resourceNames: string[]): number | undefined {
  return resourceNames.reduce<number | undefined>((prev, curr) => {
    const countForResource = getCountForResource(data ?? [], curr);
    if (countForResource === undefined) {
      return prev;
    }
    return (prev ?? 0) + countForResource;
  }, undefined);
}

const activeCount = $derived(getCountForResources(activeResourcesCount.data?.counts, resources));

const count = $derived(getCountForResources(resourcesCount.data?.counts, resources));

const permitted = $derived.by(() => {
  const currentContextName = currentContext.data?.contextName;
  if (!currentContextName) {
    return false;
  }
  return resources.some(resource =>
    contextsPermissions.data?.permissions.some(
      permission =>
        permission.contextName == currentContextName && permission.resourceName === resource && permission.permitted,
    ),
  );
});

async function openLink(): Promise<void> {
  navigator.navigateTo({ kind });
}
</script>

<button
  class="flex flex-col gap-4 p-4 bg-(--pd-content-card-carousel-card-bg) hover:bg-(--pd-content-card-carousel-card-hover-bg) rounded-md"
  class:opacity-60={!permitted}
  onclick={openLink}>
  <div class="text-start flex">
    <span class="text-(--pd-invert-content-card-text) font-semibold grow">{type}</span>
    {#if !permitted}
      <span class="ml-1"
        ><Tooltip bottom={true} class="" tip={`${type} are not accessible`}
          ><div><Fa size="1x" icon={faQuestionCircle} /></div></Tooltip
        ></span>
    {/if}
  </div>
  <div class="grid {activeCount !== undefined ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full grow items-end">
    <div class="justify-self-center text-(--pd-button-primary-bg)">
      <KubernetesIcon kind={iconName} size="40" />
    </div>
    {#if activeCount !== undefined}
      <div class="flex flex-col">
        <span class="text-(--pd-invert-content-card-text)">Active</span>
        <div class="text-2xl text-(--pd-invert-content-card-text)" aria-label="{type} active count">
          {#if permitted}{activeCount}{:else}-{/if}
        </div>
      </div>
    {/if}
    <div class="flex flex-col">
      <span class="text-(--pd-invert-content-card-text)">Total</span>
      <div class="text-2xl text-(--pd-invert-content-card-text)" aria-label="{type} count">
        {#if permitted}{count}{:else}-{/if}
      </div>
    </div>
  </div>
</button>
