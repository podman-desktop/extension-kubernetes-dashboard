<script lang="ts">
import DeleteAction from '/@/component/objects/columns/DeleteAction.svelte';
import RestartAction from '/@/component/objects/columns/RestartAction.svelte';
import type { Props } from './props';

let { object }: Props = $props();
</script>

<DeleteAction object={object} />
<RestartAction object={object} />
