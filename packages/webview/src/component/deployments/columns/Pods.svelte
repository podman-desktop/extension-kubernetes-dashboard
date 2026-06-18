<script lang="ts">
import { getContext } from 'svelte';

import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ScaleEditorState } from '/@/component/deployments/scale-editor-state.svelte';
import ScaleAction from './ScaleAction.svelte';
import type { Props } from './props';

let { object }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const scaleEditorState = dependencyAccessor.get<ScaleEditorState>(ScaleEditorState);

let deploymentKey = $derived(`${object.namespace}/${object.name}`);
let editing = $derived(scaleEditorState.isEditing(deploymentKey));
</script>

<div class="flex flex-row items-center gap-2 text-(--pd-table-body-text)">
  {#if editing}
    <ScaleAction object={object} mode="editor" />
  {:else}
    <span>{object.ready} / {object.replicas}</span>
  {/if}
</div>
