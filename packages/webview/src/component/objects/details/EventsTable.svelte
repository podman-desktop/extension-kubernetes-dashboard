<script lang="ts">
import humanizeDuration from 'humanize-duration';
import moment from 'moment';
import type { EventUI } from '/@/component/objects/EventUI';

interface Props {
  events: readonly EventUI[];
}

let { events }: Props = $props();

let sortedEvents: EventUI[] = $derived(
  events.toSorted((ev1, ev2) => ((ev1.lastTimestamp ?? Date.now()) < (ev2.lastTimestamp ?? Date.now()) ? -1 : 1)),
);

function getAgeAndCount(event: EventUI): string {
  let result = `${humanizeDuration(moment().diff(event.lastTimestamp), { round: true, largest: 1 })}`;
  if ((event.count ?? 0) > 1) {
    result += ` (${event.count}x over ${humanizeDuration(moment().diff(event.firstTimestamp), { round: true, largest: 1 })})`;
  }
  return result;
}
</script>

<tr>
  <td colspan="2">
    <table class="w-full ml-2.5 border-separate border-spacing-x-3 border-spacing-y-1" aria-label="events">
      <tbody>
        <tr>
          <th scope="col" class="px-2 py-1 text-left">Type</th>
          <th scope="col" class="px-2 py-1 text-left">Reason</th>
          <th scope="col" class="px-2 py-1 text-left">Age</th>
          <th scope="col" class="px-2 py-1 text-left">From</th>
          <th scope="col" class="px-2 py-1 text-left">Message</th>
        </tr>
        {#each sortedEvents as event, index (index)}
          <tr>
            <td class="px-2 py-1 align-top">{event.type}</td>
            <td class="px-2 py-1 align-top">{event.reason}</td>
            <td class="px-2 py-1 align-top">{getAgeAndCount(event)}</td>
            <td class="px-2 py-1 align-top">{event.reportingComponent}</td>
            <td class="px-2 py-1 align-top">{event.message}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </td>
</tr>
