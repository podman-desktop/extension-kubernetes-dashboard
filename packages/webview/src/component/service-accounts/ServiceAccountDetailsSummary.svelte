<script lang="ts">
import type { V1ServiceAccount } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';

interface Props {
  object: V1ServiceAccount;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  <EventsDetails events={events} />
</Table>
