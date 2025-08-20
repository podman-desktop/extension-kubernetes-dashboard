<script lang="ts">
import type { V1DeploymentStatus } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';
import ConditionsTable from '/@/component/objects/details/ConditionsTable.svelte';

interface Props {
  status: V1DeploymentStatus;
}
let { status }: Props = $props();
</script>

<tr>
  <Title>Status</Title>
</tr>
<tr>
  <Cell>Replicas</Cell>
  <Cell>
    Desired: {status.replicas ?? 'N/A'}, Updated: {status.updatedReplicas ?? 'N/A'}, Total: {status.replicas ?? 'N/A'},
    Available: {status.availableReplicas ?? 'N/A'}, Unavailable: {status.unavailableReplicas ?? 'N/A'}
  </Cell>
</tr>
{#if status.conditions}
  <tr>
    <Title>Conditions</Title>
  </tr>
  <ConditionsTable conditions={status.conditions} />
{/if}
