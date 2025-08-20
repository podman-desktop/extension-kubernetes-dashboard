<script lang="ts">
import type { V1Deployment } from '@kubernetes/client-node';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import Table from '/@/component/details/Table.svelte';
import DeploymentStatusDetails from './details/DeploymentStatusDetails.svelte';
import DeploymentSpecDetails from './details/DeploymentSpecDetails.svelte';
import type { EventUI } from '/@/component/objects/EventUI';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';

interface Props {
  object: V1Deployment;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <DeploymentStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <DeploymentSpecDetails name={object.metadata?.name} namespace={object.metadata?.namespace} spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
