<script lang="ts">
import type { V1Namespace } from '@kubernetes/client-node';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import Table from '/@/component/details/Table.svelte';

interface Props {
  object: V1Namespace;
}
let { object }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
</Table>
