<script lang="ts" generics="T extends KubernetesObject, U extends KubernetesObjectUI">
import type { CoreV1Event, KubernetesObject } from '@kubernetes/client-node';
import { getContext, onDestroy, onMount, type Component } from 'svelte';
import { router } from 'tinro';

import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { Navigator } from '/@/navigation/navigator';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import type { ContextResourceDetails } from '/@common/model/context-resources-details';
import type { ContextResourceEvents } from '/@common/model/context-resource-events';
import type { KubernetesObjectUI } from '/@/component/objects/KubernetesObjectUI';
import { DetailsPage, StatusIcon, Tab } from '@podman-desktop/ui-svelte';
import Route from '/@/Route.svelte';
import KubernetesIcon from '/@/component/icons/KubernetesIcon.svelte';
import { icon } from '/@/component/icons/icon';
import type { EventUI } from '/@/component/objects/EventUI';

interface Props<T extends KubernetesObject, U extends KubernetesObjectUI> {
  typed: T;
  typedUI: U;
  kind: string;
  resourceName: string;
  name: string;
  namespace?: string;
  transformer: (o: T) => U;
  SummaryComponent: Component<{ object: T; events: readonly EventUI[] }>;
}
let {
  kind,
  resourceName,
  name,
  namespace,
  transformer,
  SummaryComponent,
  typed: _typed,
  typedUI: _typedUI,
}: Props<T, U> = $props();

let detailsPage: DetailsPage | undefined = $state(undefined);

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get(Navigator);

const resourceDetails = getContext<States>(States).stateResourceDetailsInfoUI;
const resourceEvents = getContext<States>(States).stateResourceEventsInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

let unsubscribers: Unsubscriber[] = [];

let initialCurrentContextName: string | undefined = $state(undefined);

const object = $derived(filterResources(resourceDetails.data?.resources ?? []));
const objectUI = $derived(object ? transformer(object as T) : undefined);
const events = $derived(
  object?.metadata?.uid && resourceEvents?.data?.events
    ? filterEvents(resourceEvents.data.events, object.metadata.uid)
    : [],
);

let eventsSubscribed = false;
$effect(() => {
  if (eventsSubscribed || !initialCurrentContextName || !object?.metadata?.uid) {
    return;
  }
  unsubscribers.push(
    resourceEvents.subscribe({
      contextName: initialCurrentContextName,
      uid: object.metadata.uid,
    }),
  );
  eventsSubscribed = true;
});

$effect(() => {
  if (initialCurrentContextName && currentContext.data?.contextName !== initialCurrentContextName) {
    navigateToList();
  }
});

onMount(() => {
  initialCurrentContextName = currentContext.data?.contextName;
  if (!initialCurrentContextName) {
    navigateToList();
    return;
  }
  // returns the unsubscriber, which will be called automatically at destroy time
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(
    resourceDetails.subscribe({
      contextName: initialCurrentContextName,
      resourceName,
      name,
      namespace,
    }),
  );
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
});

function filterResources(allResources: ContextResourceDetails[]): KubernetesObject | undefined {
  return allResources.find(
    resources =>
      resources.contextName === initialCurrentContextName &&
      resources.resourceName === resourceName &&
      resources.name === name &&
      (!namespace || resources.namespace === namespace),
  )?.details;
}

function filterEvents(allEvents: ContextResourceEvents[], uid: string): readonly CoreV1Event[] | undefined {
  return allEvents.find(events => events.contextName === initialCurrentContextName && events.uid === uid)?.events;
}

function navigateToList(): void {
  router.goto(navigator.kubernetesResourcesURL(kind));
}
</script>

{#if objectUI && object}
  <DetailsPage title={objectUI.name} bind:this={detailsPage}>
    {#snippet iconSnippet()}
      {#if object}<StatusIcon icon={icon[kind] ?? KubernetesIcon} size={24} status={objectUI.status} />{/if}
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
      <Route path="/summary">
        <SummaryComponent object={object as T} events={events ?? []} />
      </Route>
      <Route path="/inspect">
        <!--MonacoEditor content={JSON.stringify(object, undefined, 2)} language="json" /-->
      </Route>
      <Route path="/kube">
        <!--KubeEditYAML content={stringify(object)} /-->
      </Route>
    {/snippet}
  </DetailsPage>
{/if}
