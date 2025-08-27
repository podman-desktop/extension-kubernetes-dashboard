<script lang="ts">
import type { V1PersistentVolumeClaim } from '@kubernetes/client-node';

import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';
import type { EventUI } from '/@/component/objects/EventUI';
import PvcStatusDetails from '/@/component/pvcs/details/PVCStatusDetails.svelte';
import PvcSpecDetails from '/@/component/pvcs/details/PVCSpecDetails.svelte';

interface Props {
  object: V1PersistentVolumeClaim;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <PvcStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <PvcSpecDetails spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
