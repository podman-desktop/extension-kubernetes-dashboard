<script lang="ts">
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { NumberInput, Tooltip } from '@podman-desktop/ui-svelte';

import IconButton from '/@/component/button/IconButton.svelte';

import { API_CONTEXTS } from '@kubernetes-dashboard/channels';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';

import type { Props } from './props';

let { object }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

// The replica count the user wants to apply. Seeded from the current value and
// kept in sync with backend updates as long as the user has no pending change.
// svelte-ignore state_referenced_locally
let desiredReplicas = $state(object.replicas);
// svelte-ignore state_referenced_locally
let lastKnownReplicas = $state(object.replicas);
let error = $state<string | undefined>(undefined);

$effect(() => {
  if (object.replicas !== lastKnownReplicas) {
    // Adopt the new value only when the user has not started editing.
    if (desiredReplicas === lastKnownReplicas) {
      desiredReplicas = object.replicas;
    }
    lastKnownReplicas = object.replicas;
  }
});

let canScale = $derived(object.status !== 'DELETING' && !error && desiredReplicas !== object.replicas);

async function scaleObject(): Promise<void> {
  if (!canScale) {
    return;
  }
  await contextsApi.scaleObject(object.kind, object.name, object.namespace, desiredReplicas);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    scaleObject().catch(console.error);
  }
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-row items-center gap-1" onkeydown={onKeydown}>
  <Tooltip tip={`Scale the number of replicas for ${object.kind} ${object.name}`}>
    <NumberInput
      type="integer"
      minimum={0}
      bind:value={desiredReplicas}
      bind:error={error}
      disabled={object.status === 'DELETING'}
      aria-label={`Desired replica count for ${object.name}`}
      class="w-14" />
  </Tooltip>
  {#if canScale}
    <IconButton title={`Scale ${object.kind}`} onClick={scaleObject} icon={faCheck} />
  {/if}
</div>
