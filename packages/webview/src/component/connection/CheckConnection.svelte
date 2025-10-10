<script lang="ts">
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@podman-desktop/ui-svelte';
import { getContext, onDestroy, onMount } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '@kubernetes-dashboard/channels';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const contextsHealths = states.stateContextsHealthsInfoUI;

let unsubscribers: Unsubscriber[] = [];

onMount(() => {
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(contextsHealths.subscribe());
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
});

const inProgress = $derived.by(() => {
  if (!currentContext.data?.contextName) {
    return false;
  }
  return contextsHealths.data?.healths.find(health => health.contextName === currentContext.data?.contextName)
    ?.checking;
});

const isReachableAndNotOffline = $derived.by(() => {
  if (!currentContext.data?.contextName) {
    return false;
  }
  const health = contextsHealths.data?.healths.find(health => health.contextName === currentContext.data?.contextName);
  return health?.reachable && !health.offline;
});

let error = $state<string>('');

function refresh(): void {
  if (currentContext.data?.contextName) {
    contextsApi.refreshContextState(currentContext.data.contextName).catch((err: unknown) => {
      error = String(err);
    });
  }
}
</script>

{#if currentContext.data?.contextName && !isReachableAndNotOffline}
  <Button on:click={refresh} icon={faRefresh} inProgress={inProgress}>Refresh</Button>
  {#if error}<div class="p-2 text-[var(--pd-state-error)]">{error}</div>{/if}
{/if}
