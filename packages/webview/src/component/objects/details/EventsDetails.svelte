<script lang="ts">
import EventsTable from './EventsTable.svelte';
import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import type { EventUI } from '/@/component/objects/EventUI';

interface Props {
  events: readonly EventUI[];
}

let { events }: Props = $props();
</script>

<tr>
  <Title>Events</Title>
</tr>
{#if events?.length}
  <EventsTable events={events} />
{:else}
  <tr><Cell>No events</Cell></tr>
{/if}
