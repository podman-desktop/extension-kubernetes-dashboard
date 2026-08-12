<script lang="ts">
import type { V1ClusterRole } from '@kubernetes/client-node';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';

interface Props {
  object: V1ClusterRole;
}
let { object }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
</Table>
