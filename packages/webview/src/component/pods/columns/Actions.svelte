<script lang="ts">
import DeleteAction from '/@/component/objects/columns/DeleteAction.svelte';
import type { Props } from './props';
import RestartAction from '../../objects/columns/RestartAction.svelte';

let { object }: Props = $props();
</script>

<DeleteAction object={object} />
<RestartAction object={object} />
