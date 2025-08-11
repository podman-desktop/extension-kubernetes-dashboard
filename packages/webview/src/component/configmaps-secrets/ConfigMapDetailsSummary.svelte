<script lang="ts">
import type { V1ConfigMap } from '@kubernetes/client-node';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import Table from '/@/component/details/Table.svelte';
import ConfigMapSpecDetails from '/@/component/configmaps-secrets/details/ConfigMapSpecDetails.svelte';

interface Props {
  object: V1ConfigMap;
}
let { object }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  <ConfigMapSpecDetails object={object} />
</Table>
