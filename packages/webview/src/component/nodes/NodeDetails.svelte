<script lang="ts">
import type { KubernetesObject } from '@kubernetes/client-node';
import { DetailsPage, StatusIcon, Tab } from '@podman-desktop/ui-svelte';
import { getContext, onDestroy, onMount } from 'svelte';
import { router } from 'tinro';

import Route from '../../Route.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import NodeIcon from '../icons/NodeIcon.svelte';
import { Navigator } from '/@/navigation/navigator';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import type { ContextResourceDetails } from '/@common/model/context-resources-details';
import { NodeHelper } from './node-helper';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const nodeHelper = dependencyAccessor.get<NodeHelper>(NodeHelper);
const navigator = dependencyAccessor.get(Navigator);

const resourceDetails = getContext<States>(States).stateResourceDetailsInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

let unsubscriber: Unsubscriber | undefined;

const node = $derived(filterResources(resourceDetails.data?.resources ?? []));
const nodeUI = $derived(node ? nodeHelper.getNodeUI(node) : undefined);

$effect(() => {
  // first unsubscribe from previous context
  unsubscribeFromContext();
  if (name && currentContext.data?.contextName) {
    subscribeToContext(currentContext.data.contextName, name);
  }
});

function subscribeToContext(contextName: string, name: string): void {
  unsubscriber = resourceDetails.subscribe({
    contextName: contextName,
    resourceName: 'nodes',
    name,
  });
}

function unsubscribeFromContext(): void {
  unsubscriber?.();
  unsubscriber = undefined;
}

onMount(() => {
  // returns the unsubscriber, which will be called automatically at destroy time
  return currentContext.subscribe();
});

onDestroy(() => {
  unsubscribeFromContext();
});

function filterResources(allResources: ContextResourceDetails[]): KubernetesObject | undefined {
  return allResources.find(
    resources =>
      resources.contextName === currentContext.data?.contextName &&
      resources.resourceName === 'nodes' &&
      resources.name === name,
  )?.details;
}

let detailsPage: DetailsPage | undefined = $state(undefined);
let kubeError: string | undefined = $state(undefined);
</script>

{#if nodeUI}
  <DetailsPage title={nodeUI.name} bind:this={detailsPage}>
    {#snippet iconSnippet()}
      {#if nodeUI}<StatusIcon icon={NodeIcon} size={24} status={nodeUI.status} />{/if}
    {/snippet}
    {#snippet tabsSnippet()}
      <Tab
        title="Summary"
        selected={navigator.isTabSelected($router.path, 'summary')}
        url={navigator.getTabUrl($router.path, 'summary')} />
      <Tab
        title="Inspect"
        selected={navigator.isTabSelected($router.path, 'inspect')}
        url={navigator.getTabUrl($router.path, 'inspect')} />
      <Tab
        title="Kube"
        selected={navigator.isTabSelected($router.path, 'kube')}
        url={navigator.getTabUrl($router.path, 'kube')} />
    {/snippet}
    {#snippet contentSnippet()}
      <Route path="/summary">Summary (TODO)</Route>
      <Route path="/inspect">Inspect (TODO)</Route>
      <Route path="/kube">Kube (TODO)</Route>
    {/snippet}
  </DetailsPage>
{/if}
