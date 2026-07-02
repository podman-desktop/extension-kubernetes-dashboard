<script lang="ts">
import { getContext } from 'svelte';

import { States } from '/@/state/states';
import ScaleAction from './ScaleAction.svelte';
import type { Props } from './props';

let { object }: Props = $props();

const scaleEditorState = getContext<States>(States).stateScaleEditorInfoUI;

let deploymentKey = $derived(`${object.namespace}/${object.name}`);
let editing = $derived(scaleEditorState.data?.deploymentKey === deploymentKey);
</script>

<div class="flex flex-row items-center gap-2 text-(--pd-table-body-text)">
  {#if editing}
    <ScaleAction object={object} mode="editor" />
  {:else}
    <span>{object.ready} / {object.replicas}</span>
  {/if}
</div>
