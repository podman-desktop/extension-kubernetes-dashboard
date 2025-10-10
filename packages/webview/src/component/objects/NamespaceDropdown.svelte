<script lang="ts">
import { Dropdown } from '@podman-desktop/ui-svelte';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '@kubernetes-dashboard/channels';

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const contextsHealth = states.stateContextsHealthsInfoUI;
const updateResource = states.stateUpdateResourceInfoUI;

const currentContextName = $derived(currentContext.data?.contextName);
const currentNamespace = $derived(currentContext.data?.namespace);

const reachable = $derived(
  contextsHealth.data?.healths.some(
    contextHealth => contextHealth.contextName === currentContextName && contextHealth.reachable,
  ),
);

const namespaces = $derived(
  updateResource?.data?.resources
    .filter(resources => !resources.contextName && resources.resourceName === 'namespaces')
    .flatMap(contextResourceItems =>
      contextResourceItems.items.map(namespace => namespace.metadata?.name ?? '(unknown)'),
    )
    .toSorted(),
);

async function handleNamespaceChange(value: unknown): Promise<void> {
  const namespace = String(value);
  await contextsApi.setCurrentNamespace(namespace);
}

let unsubscribers: Unsubscriber[] = [];

onMount(() => {
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(contextsHealth.subscribe());
  unsubscribers.push(
    updateResource.subscribe({
      contextName: undefined, // current context
      resourceName: 'namespaces',
    }),
  );
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
});
</script>

<Dropdown
  ariaLabel="Kubernetes Namespace"
  name="namespace"
  class="w-56 max-w-56"
  value={currentNamespace}
  disabled={!reachable}
  onChange={handleNamespaceChange}
  options={namespaces?.map(namespace => ({
    label: namespace,
    value: namespace,
  }))}>
  {#snippet left()}
    <div class="mr-1 text-[var(--pd-input-field-placeholder-text)]">Namespace:</div>
  {/snippet}
</Dropdown>
