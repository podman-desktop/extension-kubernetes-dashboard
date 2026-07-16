<script lang="ts">
import DeleteAction from '/@/component/objects/columns/DeleteAction.svelte';
import type { Props } from './props';
import ScaleAction from './ScaleAction.svelte';

let { object, details }: Props = $props();
</script>

<div class="flex flex-row items-center justify-end gap-1">
  <ScaleAction object={object} mode="button" showInput={details} />
  <DeleteAction object={object} />
</div>
