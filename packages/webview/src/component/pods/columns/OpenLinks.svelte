<script lang="ts">
import type { Props } from './props';
import { States } from '/@/state/states';
import { getContext, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import IconButton from '/@/component/button/IconButton.svelte';
import { faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import type { Endpoint } from '/@common/model/endpoint';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM } from '/@common/channels';

let { object }: Props = $props();

let initialCurrentContextName: string | undefined = $state(undefined);

let unsubscribers: Unsubscriber[] = [];
const states = getContext<States>(States);
const endpoints = states.stateEndpointsInfoUI;
const currentContext = states.stateCurrentContextInfoUI;

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

onMount(() => {
  initialCurrentContextName = currentContext.data?.contextName;
  if (!initialCurrentContextName) {
    return;
  }
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(
    endpoints.subscribe({
      contextName: initialCurrentContextName,
      targetKind: 'Pod',
      targetName: object.name,
      targetNamespace: object.namespace,
    }),
  );
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
});

function filterEndpoints(endpoints: Endpoint[]): Endpoint[] {
  return endpoints.filter(
    endpoint =>
      endpoint.targetName === object.name &&
      endpoint.targetNamespace === object.namespace &&
      endpoint.targetKind === 'Pod',
  );
}

async function openEndpoint(endpoint: Endpoint): Promise<void> {
  await systemApi.openExternal(endpoint.url);
}
</script>

{#if endpoints.data?.endpoints}
  {#each filterEndpoints(endpoints.data?.endpoints) as endpoint, index (index)}
    <IconButton
      title={`Open ${endpoint.inputName}`}
      onClick={(): Promise<void> => openEndpoint(endpoint)}
      icon={faExternalLinkSquareAlt} />
  {/each}
{/if}
