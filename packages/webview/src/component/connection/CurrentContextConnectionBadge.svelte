<script lang="ts">
import { getContext, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';

import Label from '/@/component/label/Label.svelte';
import { States } from '/@/state/states';
import type { ContextHealth } from '@kubernetes-dashboard/channels';
import { Spinner } from '@podman-desktop/ui-svelte';

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const contextsHealths = states.stateContextsHealthsInfoUI;

interface Info {
  text: string;
  classColor: string;
  tip?: string;
  checking: boolean;
}

let unsubscribers: Unsubscriber[] = [];

function subscribeToStates(): void {
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(contextsHealths.subscribe());
}

function unsubscribeFromStates(): void {
  unsubscribers.forEach(unsubscriber => unsubscriber());
}

onMount(() => {
  subscribeToStates();
});

onDestroy(() => {
  unsubscribeFromStates();
});

const info = $derived.by<Info | undefined>(() => {
  const currentContextName = currentContext.data?.contextName;
  if (!currentContextName) {
    return undefined;
  }
  const health = contextsHealths.data?.healths.find(health => health.contextName === currentContextName);
  if (!health) {
    return undefined;
  }
  return {
    checking: health.checking,
    text: getText(health),
    classColor: getClassColor(health),
    tip: getTip(health),
  };
});

function getText(health: ContextHealth): string {
  if (health.offline) return 'Connection lost';
  if (health.reachable) return 'Connected';
  return 'Cluster not reachable';
}

function getClassColor(health: ContextHealth): string {
  if (health.offline) return 'bg-(--pd-status-paused)';
  if (health.reachable) return 'bg-(--pd-status-connected)';
  return 'bg-(--pd-status-disconnected)';
}

function getTip(health: ContextHealth): string {
  if (health.offline) return 'connection lost, you can try to reconnect';
  if (health.reachable) return '';
  return 'health check not responding';
}
</script>

{#if info}
  <div class="flex items-center flex-row">
    {#if info.checking}
      <div class="mr-1"><Spinner size="12px"></Spinner></div>
    {/if}
    <Label role="status" name={info.text} tip={info.tip}>
      <div class="w-2 h-2 {info.classColor} rounded-full mx-1"></div>
    </Label>
  </div>
{/if}
