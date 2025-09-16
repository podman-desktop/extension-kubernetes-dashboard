<script lang="ts">
import DeleteAction from '/@/component/objects/columns/DeleteAction.svelte';
import type { Props } from './props';
import RestartAction from '../../objects/columns/RestartAction.svelte';
import OpenLinks from './OpenLinks.svelte';

let { object, details = false }: Props = $props();
</script>

<DeleteAction object={object} />
<RestartAction object={object} />

{#if details}
  <OpenLinks object={object} />
{/if}
