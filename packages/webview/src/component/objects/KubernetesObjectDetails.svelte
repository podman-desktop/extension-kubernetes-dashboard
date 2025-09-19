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
import StateChange from '/@/component/objects/StateChange.svelte';
import { KubernetesObjectUIHelper } from './kubernetes-object-ui-helper';
import MonacoEditor from '/@/component/editor/MonacoEditor.svelte';
import { stringify } from 'yaml';
import EditYAML from '/@/component/editor/EditYAML.svelte';

interface TabInfo<T extends KubernetesObject> {
  title: string;
  url: string;
  component: Component<{ object: T }>;
}

interface Props<T extends KubernetesObject, U extends KubernetesObjectUI> {
  typed: T;
  typedUI: U;
  kind: string;
  resourceName: string;
  listName: string;
  name: string;
  namespace?: string;
  transformer: (o: T) => U;
  tabs?: TabInfo<T>[];
  SummaryComponent: Component<{ object: T; events: readonly EventUI[] }>;
  ActionsComponent?: Component<{ object: U; details?: boolean }>;
}
let {
  kind,
  resourceName,
  name,
  namespace,
  listName,
  transformer,
  tabs = [],
  SummaryComponent,
  ActionsComponent,
  typed: _typed,
  typedUI: _typedUI,
}: Props<T, U> = $props();

let detailsPage: DetailsPage | undefined = $state(undefined);

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get(Navigator);
const objectHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

const resourceDetails = getContext<States>(States).stateResourceDetailsInfoUI;
const resourceEvents = getContext<States>(States).stateResourceEventsInfoUI;
const currentContext = getContext<States>(States).stateCurrentContextInfoUI;

let unsubscribers: Unsubscriber[] = [];

let initialCurrentContextName: string | undefined = $state(undefined);

const object = $derived(filterResources(resourceDetails.data?.resources ?? []));

// we remove the managedFields which are very verbose, and not very useful as is
const simplifiedObject = $derived({ ...object, metadata: { ...object?.metadata, managedFields: undefined } });

// we keep only user-editable fields in editableObject
const editableObject = $derived({
  ...object,
  metadata: {
    name: object?.metadata?.name,
    generateName: object?.metadata?.generateName,
    namespace: object?.metadata?.namespace,
    labels: object?.metadata?.labels,
    annotations: object?.metadata?.annotations,
  },
  status: undefined,
});

const objectUI = $derived(object ? transformer(object as T) : undefined);
const events = $derived(
  object?.metadata?.uid && resourceEvents?.data?.events
    ? filterEvents(resourceEvents.data.events, object.metadata.uid)
    : [],
);
const subtitle = $derived(objectUI && objectHelper.isNamespaced(objectUI) ? objectUI.namespace : undefined);

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

let found = $state(false);
$effect(() => {
  if (!found && object) {
    found = true;
  }
});

$effect(() => {
  if (found && !object) {
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
  <DetailsPage
    title={objectUI.name}
    subtitle={subtitle}
    bind:this={detailsPage}
    breadcrumbLeftPart={listName}
    breadcrumbRightPart="Details"
    onbreadcrumbClick={navigateToList}
    onclose={navigateToList}>
    {#snippet iconSnippet()}
      {#if object}<StatusIcon icon={icon[kind] ?? KubernetesIcon} size={24} status={objectUI.status} />{/if}
    {/snippet}
    {#snippet actionsSnippet()}
      {#if ActionsComponent && objectUI}<ActionsComponent details={true} object={objectUI} />{/if}
    {/snippet}
    {#snippet detailSnippet()}
      {#if objectUI}
        <div class="flex py-2 w-full justify-end text-sm text-[var(--pd-content-text)]">
          <StateChange state={objectUI.status} />
        </div>
      {/if}
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
        title="Patch"
        selected={navigator.isTabSelected($router.path, 'patch')}
        url={navigator.getTabUrl($router.path, 'patch')} />
      {#each tabs as tab (tab.url)}
        <Tab
          title={tab.title}
          selected={navigator.isTabSelected($router.path, tab.url)}
          url={navigator.getTabUrl($router.path, tab.url)} />
      {/each}
    {/snippet}
    {#snippet contentSnippet()}
      <Route path="/summary">
        <SummaryComponent object={object as T} events={events ?? []} />
      </Route>
      <Route path="/inspect">
        <MonacoEditor content={JSON.stringify(simplifiedObject, undefined, 2)} language="json" />
      </Route>
      <Route path="/patch">
        <EditYAML content={stringify(editableObject)} />
      </Route>
      {#each tabs as tab (tab.url)}
        <Route path={'/' + tab.url}>
          <tab.component object={object as T} />
        </Route>
      {/each}
    {/snippet}
  </DetailsPage>
{/if}
