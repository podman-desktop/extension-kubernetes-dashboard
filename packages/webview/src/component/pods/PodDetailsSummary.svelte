<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';
import PodStatusDetails from './details/PodStatusDetails.svelte';
import PodSpecDetails from './details/PodSpecDetails.svelte';

interface Props {
  object: V1Pod;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <PodStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <PodSpecDetails podName={object.metadata?.name} namespace={object.metadata?.namespace} spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
