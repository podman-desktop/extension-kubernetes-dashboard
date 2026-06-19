<script lang="ts">
import { faArrowsUpDown, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { NumberInput, Tooltip } from '@podman-desktop/ui-svelte';

import IconButton from '/@/component/button/IconButton.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ScaleEditorController } from '/@/component/deployments/scale-editor-controller';

import { API_CONTEXTS } from '@kubernetes-dashboard/channels';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { States } from '/@/state/states';

import type { Props } from './props';

let { object, mode = 'button' }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);
const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const scaleEditorController = dependencyAccessor.get<ScaleEditorController>(ScaleEditorController);
const scaleEditorState = getContext<States>(States).stateScaleEditorInfoUI;

let deploymentKey = $derived(`${object.namespace}/${object.name}`);

// svelte-ignore state_referenced_locally
let desiredReplicas = $state(object.replicas);
// svelte-ignore state_referenced_locally
let lastKnownReplicas = $state(object.replicas);
let error = $state<string | undefined>(undefined);
$effect(() => {
  if (object.replicas !== lastKnownReplicas) {
    if (scaleEditorState.data?.deploymentKey !== deploymentKey || desiredReplicas === lastKnownReplicas) {
      desiredReplicas = object.replicas;
    }
    lastKnownReplicas = object.replicas;
  }
});

let canScale = $derived(object.status !== 'DELETING' && !error && desiredReplicas !== object.replicas);
let editing = $derived(scaleEditorState.data?.deploymentKey === deploymentKey);

function startEditing(): void {
  desiredReplicas = object.replicas;
  error = undefined;
  scaleEditorController.startEditing(deploymentKey);
}

function cancelEditing(): void {
  desiredReplicas = object.replicas;
  error = undefined;
  scaleEditorController.stopEditing();
}

async function scaleObject(): Promise<void> {
  if (!canScale) {
    return;
  }
  await contextsApi.scaleObject(object.kind, object.name, object.namespace, desiredReplicas);
  scaleEditorController.stopEditing();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    scaleObject().catch(console.error);
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelEditing();
  }
}
</script>

{#if mode === 'button'}
  {#if editing}
    <IconButton title={`Cancel scaling ${object.kind}`} onClick={cancelEditing} icon={faTimes} />
  {:else}
    <IconButton
      enabled={object.status !== 'DELETING'}
      title={`Scale ${object.kind}`}
      onClick={startEditing}
      icon={faArrowsUpDown} />
  {/if}
{:else if editing}
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
        class="w-18" />
    </Tooltip>
    <IconButton enabled={canScale} title={`Apply scale for ${object.kind}`} onClick={scaleObject} icon={faCheck} />
  </div>
{/if}
