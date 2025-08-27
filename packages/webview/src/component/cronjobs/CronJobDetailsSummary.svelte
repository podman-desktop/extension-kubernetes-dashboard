<script lang="ts">
import type { V1CronJob } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';
import CronJobStatusDetails from './details/CronJobStatusDetails.svelte';
import CronJobSpecDetails from './details/CronJobSpecDetails.svelte';

interface Props {
  object: V1CronJob;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <CronJobStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <CronJobSpecDetails spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
