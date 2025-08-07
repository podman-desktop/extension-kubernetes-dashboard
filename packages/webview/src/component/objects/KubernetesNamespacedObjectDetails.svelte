<script lang="ts">
import type { CoreV1Event, KubernetesObject } from '@kubernetes/client-node';
import { getContext, onDestroy, onMount, type Snippet } from 'svelte';
import { router } from 'tinro';

import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { Navigator } from '/@/navigation/navigator';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import type { ContextResourceDetails } from '/@common/model/context-resources-details';
import type { ContextResourceEvents } from '/@common/model/context-resource-events';
import type { KubernetesNamespacedObjectUI } from './KubernetesObjectUI';

interface Props {
  kind: string;
  resourceName: string;
  name: string;
  namespace: string;
  transformer: (o: KubernetesObject) => KubernetesNamespacedObjectUI;
  content: Snippet<
    [{ object: KubernetesObject; objectUI: KubernetesNamespacedObjectUI; events?: readonly CoreV1Event[] }]
  >;
}
let { kind, resourceName, name, namespace, transformer, content }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get(Navigator);

const resourceDetails = getContext<States>(States).stateResourceDetailsInfoUI;
const resourceEvents = getContext<States>(States).stateResourceEventsInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

let unsubscribers: Unsubscriber[] = [];

let initialCurrentContextName: string | undefined = $state(undefined);

const object = $derived(filterResources(resourceDetails.data?.resources ?? []));
const objectUI = $derived(object ? transformer(object) : undefined);
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
      resources.namespace === namespace,
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
  {@render content({ objectUI: objectUI, object: object, events })}
{/if}
