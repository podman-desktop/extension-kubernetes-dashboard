<script lang="ts">
import type { V1Job } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';
import JobStatusDetails from './details/JobStatusDetails.svelte';
import JobSpecDetails from './details/JobSpecDetails.svelte';

interface Props {
  object: V1Job;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <JobStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <JobSpecDetails spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
