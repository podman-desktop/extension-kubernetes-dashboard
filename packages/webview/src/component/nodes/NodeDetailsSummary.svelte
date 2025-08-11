<script lang="ts">
import type { V1Node } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import Table from '/@/component/details/Table.svelte';
import NodeStatusDetails from '/@/component/nodes/details/NodeStatusDetails.svelte';
import NodeSpecDetails from '/@/component/nodes/details/NodeSpecDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';

interface Props {
  object: V1Node;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if object.status}
    <NodeStatusDetails status={object.status} />
  {/if}
  {#if object.spec}
    <NodeSpecDetails spec={object.spec} />
  {/if}
  <EventsDetails events={events} />
</Table>
