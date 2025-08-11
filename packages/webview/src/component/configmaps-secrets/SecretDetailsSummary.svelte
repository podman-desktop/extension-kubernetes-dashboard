<script lang="ts">
import type { V1Secret } from '@kubernetes/client-node';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import Table from '/@/component/details/Table.svelte';
import SecretSpecDetails from '/@/component/configmaps-secrets/details/SecretSpecDetails.svelte';

interface Props {
  object: V1Secret;
}
let { object }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  <SecretSpecDetails object={object} />
</Table>
