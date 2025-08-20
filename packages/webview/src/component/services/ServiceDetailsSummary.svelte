<script lang="ts">
import type { V1Service } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';
import ServiceStatusDetails from './details/ServiceStatusDetails.svelte';
import ServiceSpecDetails from './details/ServiceSpecDetails.svelte';

interface Props {
  object: V1Service;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <ServiceStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <ServiceSpecDetails serviceName={object.metadata?.name} namespace={object.metadata?.namespace} spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
