<script lang="ts">
import type { KubernetesObject } from '@kubernetes/client-node';
import type { TableColumn, TableRow } from '@podman-desktop/ui-svelte';
import { Button, FilteredEmptyScreen, NavPage, Table } from '@podman-desktop/ui-svelte';
import { getContext, onDestroy, onMount, type Snippet } from 'svelte';
import { type Unsubscriber } from 'svelte/store';

import type { KubernetesObjectUI } from './KubernetesObjectUI';
import { States } from '/@/state/states';
import type { ContextResourceItems } from '/@common/model/context-resources-items';
import { KubernetesObjectUIHelper } from './kubernetes-object-ui-helper';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import CurrentContextConnectionBadge from '/@/component/connection/CurrentContextConnectionBadge.svelte';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '/@common/channels';
import NamespaceDropdown from './NamespaceDropdown.svelte';

export interface Kind {
  resource: string;
  transformer: (o: KubernetesObject) => KubernetesObjectUI;
}

interface Props {
  kinds: Kind[];
  singular: string;
  plural: string;
  isNamespaced: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: TableRow<any>;

  emptySnippet: Snippet;
}

let { kinds, singular, plural, isNamespaced, icon, columns, row, emptySnippet }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const objectHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

let searchTerm = $state<string>('');

const states = getContext<States>(States);
const updateResource = states.stateUpdateResourceInfoUI;

let unsubscribers: Unsubscriber[] = [];

function filterResources(allResources: ContextResourceItems[], resourceName: string): ContextResourceItems[] {
  return allResources.filter(resources => !resources.contextName && resourceName === resources.resourceName);
}

const objects = $derived(
  kinds.flatMap(kind =>
    filterResources(updateResource?.data?.resources ?? [], kind.resource)
      .flatMap(resourceItems => resourceItems.items)
      .filter(object => (searchTerm ? objectHelper.findMatchInLeaves(object, searchTerm) : true))
      .map(object => kind.transformer(object)),
  ),
);

onMount(() => {
  unsubscribers = kinds.map(kind =>
    updateResource.subscribe({
      contextName: undefined, // ask for resources in the default context
      resourceName: kind.resource,
    }),
  );
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
});

let selectedItemsNumber = $state<number>(0);

async function deleteSelectedObjects(): Promise<void> {
  const selectedObjects = objects
    .filter(object => object.selected)
    .map(object => {
      if (objectHelper.isNamespaced(object)) {
        return {
          kind: object.kind,
          name: object.name,
          namespace: object.namespace,
        };
      } else {
        return {
          kind: object.kind,
          name: object.name,
        };
      }
    });
  if (selectedObjects.length === 0) {
    return;
  }

  await contextsApi.deleteObjects(selectedObjects);
}

function waitThrottleDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 500));
}
</script>

<NavPage bind:searchTerm={searchTerm} title={plural}>
  {#snippet bottomAdditionalActions()}
    {#if selectedItemsNumber > 0}
      <Button on:click={deleteSelectedObjects} title="Delete {selectedItemsNumber} selected items" icon={faTrash} />
      <span>On {selectedItemsNumber} selected items.</span>
    {/if}
    {#if isNamespaced}
      <NamespaceDropdown />
    {/if}
    <div class="flex grow justify-end">
      <CurrentContextConnectionBadge />
    </div>
  {/snippet}

  {#snippet content()}
    <div class="flex min-w-full h-full">
      <Table
        kind={singular}
        data={objects}
        columns={columns}
        row={row}
        defaultSortColumn="Name"
        bind:selectedItemsNumber={selectedItemsNumber}></Table>

      {#if objects.length === 0}
        {#if searchTerm}
          <FilteredEmptyScreen
            icon={icon}
            kind={plural}
            searchTerm={searchTerm}
            on:resetFilter={(): string => (searchTerm = '')} />
        {:else}
          {#await waitThrottleDelay() then _}
            {@render emptySnippet()}
          {/await}
        {/if}
      {/if}
    </div>
  {/snippet}
</NavPage>
